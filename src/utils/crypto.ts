import nodeCrypto from 'crypto';

export function sha256Base64Url(input: string): string {
  const digest = nodeCrypto.createHash('sha256').update(input).digest('base64');
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
