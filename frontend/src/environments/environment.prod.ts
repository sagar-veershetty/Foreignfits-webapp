export const environment = {
  production: true,
  // CloudFront must route /api and /api/* to the Elastic Beanstalk origin.
  apiUrl: '/api',
  appName: 'Foreign Fits',
  version: '1.0.0'
};
