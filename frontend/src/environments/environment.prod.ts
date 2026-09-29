export const environment = {
  production: true,
  // Served through CloudFront so both frontend and API are HTTPS and same-origin.
  // Replace with your actual CloudFront domain once the distribution is created.
  apiUrl: 'https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net/api',
  appName: 'Foreign Fits',
  version: '1.0.0'
};