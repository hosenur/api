// Assets will be embedded at compile time using Bun's file embedding
// @ts-ignore - Bun-specific import
import cloudPath from './cloud.png' with { type: 'file' };
// @ts-ignore - Bun-specific import  
import anotherCloudPath from './another-cloud.png' with { type: 'file' };

export { cloudPath, anotherCloudPath };
