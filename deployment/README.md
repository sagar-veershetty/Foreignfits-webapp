# Foreign Fits deployment

Public site: https://doeccawkify87.cloudfront.net

Custom application address: https://www.foreignfits.in/inventory

## Custom domain

The ACM certificate in `cloudfront/custom-domain.json` is issued and CloudFront
has deployed the `www.foreignfits.in` alias using SNI and TLSv1.2_2021. GoDaddy's
`www` CNAME now targets `doeccawkify87.cloudfront.net` with its existing 1-hour
TTL. Authoritative DNS and the 1.1.1.1 resolver confirm the new record. Existing
resolver caches may still reach GoDaddy and redirect to the bare domain until
they expire. The root domain and all email records remain unchanged.

HTTPS certificate verification, the inventory application shell and API health
were verified using the custom hostname connected directly to CloudFront before
the DNS switch. Image-upload CORS allows both HTTPS origins. Browser login and
a real product upload still need verification after local DNS propagation. Users
must sign in again because browser login storage is separate for each hostname.

Keep both ACM validation CNAMEs in GoDaddy for automatic certificate renewal.
The old incorrectly suffixed validation records were left untouched. CloudFront's
pre-change configuration is `/private/tmp/foreignfits-cf-before-custom-domain.json`.
To reverse the website DNS switch, restore only the `www` CNAME to `foreignfits.in.`;
do not remove email, nameserver, or certificate validation records.

AWS CLI profile: `foreignfits`; application region: `ap-south-1`.
CloudFront distribution: `E2CPBZ3MKNEBOR`.

## Product image uploads

The AWS WAF common rule set blocks request bodies above 8 KB. Keep that rule
enabled. The Angular product service requests a signed upload using
`POST /api/product-images/uploads`, sends the image directly to S3, and then
creates or updates the product with public image URLs only.

- Upload URLs require `add:product` or `edit:product` authority and expire in 5 minutes.
- Each URL signs an exact content length (1 byte through 5 MB) and image type.
- Supported image types: JPEG, PNG, WebP and GIF. Keys are random under `products/uploads/`.
- S3 requests bypass the app's authentication interceptor so JWTs never go to S3.
- Successful uploads are reused for multiple sizes and retries; failed uploads stop that product save.
- With S3 disabled, local development retains inline images. Production fails closed instead.
- Existing backend base64 handling remains for compatibility with older clients.
- An abandoned save can leave an unreferenced image. Do not expire the upload prefix:
  successful products reference those same objects.

Image bucket: `foreign-fits-product-images`.
The existing instance role, `aws-elasticbeanstalk-ec2-role`, already grants
`s3:PutObject` and `s3:GetObject` for this bucket. No IAM or public-write grants
were added. The pre-existing public-read bucket policy remains unchanged.

Apply the narrowly scoped browser CORS configuration with:

```bash
aws s3api put-bucket-cors --bucket foreign-fits-product-images \
  --cors-configuration file://deployment/s3/product-images-cors.json \
  --profile foreignfits --region ap-south-1
```

Deploy the backend before the frontend. The backend uses the existing S3 SDK
default credential chain and `S3_IMAGES_*` environment settings. Run
`mvn clean package` in `backend`, then deploy the JAR as an Elastic Beanstalk
application version. Run `./deploy-to-aws.sh` from the repo root for the frontend.

## September 29 upload release

- Backend version: `v20260929-direct-image-upload`.
- Backend rollback: `v1.0.0-initial-61` in `Foreign-fits-env`.
- Pre-release frontend entry point: `/private/tmp/foreignfits-index-before-direct-upload.html`.
- Older hashed frontend assets are retained in S3 for rollback and open sessions.
- Before this release, the image bucket had no CORS configuration.
- Deployment completed successfully; backend health endpoint returns UP.
- CloudFront invalidation `IDPJWBHZWICWXVOAOO08098T23` completed.
- Six backend tests, six frontend tests, and the production frontend build passed.
- HTTPS serves the exact new index; S3 preflight succeeds only for the configured
  origin; unauthenticated upload-metadata requests are rejected. A real product
  save with images still requires the user's confirmation after a hard refresh.

Rollback the frontend entry point before rolling back the backend, then invalidate
CloudFront. S3 CORS can remain because it does not grant upload permission on its
own. No WAF exception or CloudFront pricing-plan upgrade was applied.

## Verification

Automated tests cover presign expiry and signed length/type, MIME/size validation,
method permissions, no-store responses, token isolation, upload reuse, failure
handling, and URL-only product POST/PUT sequencing. Run:

```bash
cd backend
mvn test
cd ../frontend
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

After deployment, verify backend health, the CloudFront entry point, and S3's
OPTIONS response. Then hard-refresh a signed-in browser and save a real product
with images. Its network sequence should be a small upload-metadata POST, an S3
PUT per new image, and a small product POST. Do not create synthetic inventory
records just to smoke-test production.

## HTTPS scope

The browser uses HTTPS to CloudFront and directly to S3 for uploads. The existing
CloudFront-to-Elastic-Beanstalk and S3 website-origin connections remain HTTP.
Full origin encryption is a separate infrastructure change. The old S3 website
hostname cannot be opened with HTTPS; use the CloudFront address above.
