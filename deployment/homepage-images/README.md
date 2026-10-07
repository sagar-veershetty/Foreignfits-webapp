# Homepage images in S3

Bucket: `foreign-fits-web` (Mumbai / `ap-south-1`).

Upload approved public campaign photos directly into:

```
homepage/images/banners/newborn/
homepage/images/banners/men/
homepage/images/banners/women/
homepage/images/banners/kids/
homepage/images/banners/footwear/
```

PNG, JPG, JPEG, WebP, AVIF and GIF files are supported. Names sort alphabetically;
use `01.png`, `02.png`, etc. Up to three images form one banner panel. Additional
images form additional slides. Avoid nested folders. Prefer WebP/JPEG for smaller
downloads; use landscape group photos or similarly framed portraits.

Optional mobile replacements go in `homepage/images/mobile/<department>/` with
exactly the same filename as the corresponding banner photo. Optional category
tiles go in `homepage/images/categories/<department>/`; the first filename wins.

Adding, replacing or removing images automatically rebuilds
`homepage/manifest.json`. Refresh the homepage after AWS finishes processing the
upload (normally seconds, but asynchronous delivery can take longer). Existing
open pages do not live-refresh. Renaming in S3 is a copy/delete operation; prefer
uploading a replacement first, then removing the old file.

Only put images intended for the public website in these folders. No credentials
or public bucket-listing permission are needed in the browser. The updater can
only list this prefix, read/write the manifest and write its own logs. Its output is
outside the notification prefix, preventing recursive invocations. Conditional
writes and retries prevent simultaneous uploads from overwriting newer manifests
with older results. AWS Lambda/CloudWatch usage charges may apply.

If a valid manifest has no images for a department, its banner is omitted. If
the entire manifest is empty, malformed or unavailable, bundled banners remain
as a fallback. Catalogue products, prices and stock remain controlled by inventory.

## Setup / maintenance

From the repository root, with AWS access:

```
node deployment/homepage-images/deploy.mjs
bash deploy-to-aws.sh
```

The first command deploys the scoped CloudFormation stack, preserves unrelated
S3 notifications and seeds current images only when `homepage/` is empty. After
a partially failed first seed, upload the remaining desired files manually;
reruns deliberately do not restore removed images. The frontend deploy excludes
`homepage/*`, so it cannot overwrite your managed photos or manifest.

The live CloudFront default currently has caching disabled. If that changes,
keep `homepage/manifest.json` minimum TTL at zero and respect its no-cache header.
Image URLs include S3 ETags so a replacement changes the browser URL. Any future
CloudFront image cache policy must include the `v` query parameter in its cache key.

Rebuild manually if needed:

```
aws lambda invoke --function-name foreignfits-homepage-images --region ap-south-1 --profile foreignfits /tmp/foreignfits-homepage-result.json
```

To roll back the frontend, deploy the previous bundle. Disable only the
`foreignfits-homepage-images` S3 notification before removing the CloudFormation
stack. Keep the image objects; stack deletion does not delete them.

AWS reference: https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html
