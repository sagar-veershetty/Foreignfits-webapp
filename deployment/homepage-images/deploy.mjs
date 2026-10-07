import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'foreignfits-homepage-'));
const profile = process.env.AWS_PROFILE || 'foreignfits';
const args = ['--profile', profile, '--region', 'ap-south-1'];
const aws = (...command) => execFileSync('aws', [...command, ...args], { encoding: 'utf8' });
const json = (...command) => JSON.parse(aws(...command) || '{}');
const bucket = 'foreign-fits-web';
const existing = json('s3api', 'list-objects-v2', '--bucket', bucket, '--prefix', 'homepage/', '--max-keys', '1');
const stack = 'foreignfits-homepage-images';
const template = JSON.parse(readFileSync(join(here, 'template.json'), 'utf8'));
template.Resources.Updater.Properties.Code.ZipFile = readFileSync(join(here, 'handler.py'), 'utf8');
const templateFile = join(temp, 'template.json');
writeFileSync(templateFile, JSON.stringify(template));
console.log('Provisioning the scoped homepage updater...');
console.log(aws('cloudformation', 'deploy', '--stack-name', stack, '--template-file', templateFile,
  '--capabilities', 'CAPABILITY_IAM', '--no-fail-on-empty-changeset'));
const outputs = json('cloudformation', 'describe-stacks', '--stack-name', stack).Stacks[0].Outputs;
const arn = outputs.find(output => output.OutputKey === 'FunctionArn').OutputValue;
const config = json('s3api', 'get-bucket-notification-configuration', '--bucket', bucket);
writeFileSync(join(temp, 'notifications-before.json'), JSON.stringify(config));
const id = 'foreignfits-homepage-images';
config.LambdaFunctionConfigurations = (config.LambdaFunctionConfigurations || []).filter(entry => entry.Id !== id);
config.LambdaFunctionConfigurations.push({Id: id, LambdaFunctionArn: arn,
  Events: ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'],
  Filter: {Key: {FilterRules: [{Name: 'prefix', Value: 'homepage/images/'}]}}});
const configFile = join(temp, 'notifications.json');
writeFileSync(configFile, JSON.stringify(config));
aws('s3api', 'put-bucket-notification-configuration', '--bucket', bucket, '--notification-configuration', 'file://' + configFile);

// Seed only on first setup; future runs must not restore deliberately removed images.
if (!existing.KeyCount) {
  const seeds = {
    'banners/newborn/01.png': 'newborn-blue.png', 'banners/newborn/02.png': 'newborn-yellow.png', 'banners/newborn/03.png': 'newborn-green.png',
    'banners/men/01.png': 'men-denim-group-oct03.png', 'mobile/men/01.png': 'men-denim-oct03.png',
    'banners/women/01.png': 'women-blazer-oct03.png', 'banners/women/02.png': 'women-blazer-detail-oct03.png',
    'banners/kids/01.png': 'kids-red-jacket-oct03.png', 'banners/kids/02.png': 'kids-pink-jacket-oct03.png',
    'banners/footwear/01.png': 'footwear-group.png',
    'categories/men/01.png': 'men-denim-oct03.png', 'categories/women/01.png': 'women-blazer-oct03.png', 'categories/kids/01.png': 'kids-pink-jacket-oct03.png'
  };
  for (const [key, file] of Object.entries(seeds)) {
    console.log('Uploading', key);
    aws('s3', 'cp', resolve(here, '../../frontend/public/editorial', file), `s3://${bucket}/homepage/images/${key}`,
      '--cache-control', 'public, max-age=60', '--only-show-errors');
  }
}
let result;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    result = json('lambda', 'invoke', '--function-name', arn, join(temp, 'result.json'));
    break;
  } catch (error) {
    if (!String(error.stderr).includes('TooManyRequestsException') || attempt === 11) throw error;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
if (result.FunctionError) throw new Error(readFileSync(join(temp, 'result.json'), 'utf8'));
console.log('Homepage manifest ready:', readFileSync(join(temp, 'result.json'), 'utf8'));
console.log('Notification backup:', join(temp, 'notifications-before.json'));
