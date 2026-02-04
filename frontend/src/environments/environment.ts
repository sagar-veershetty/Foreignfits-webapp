const resolveApiUrl = () => {
  if (typeof window === 'undefined') {
    return '/api';
  }

  const host = window.location.hostname.toLowerCase();
  const isS3Hosted = host.includes('amazonaws.com') || host.includes('foreign-fits-web');
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  if (isS3Hosted) {
    return 'http://foreign-fits-env.eba-ketahdmd.ap-south-1.elasticbeanstalk.com/api';
  }

  if (isLocalhost) {
    return 'http://localhost:8080/api';
  }

  // Use relative URL so Angular proxy can intercept requests in local dev
  return '/api';
};

export const environment = {
  production: false,
  apiUrl: resolveApiUrl(),
  version: '1.0.0'
};