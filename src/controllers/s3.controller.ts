import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
});

export const signS3Upload = async (req: Request, res: Response) => {
    try {
        const { fileName, fileType } = req.body;
        if (!fileName || !fileType) {
            return res.status(400).json({ error: 'fileName and fileType are required' });
        }

        // Generate a unique key for the file, for example using the current timestamp
        const key = `uploads/${Date.now()}_${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            ContentType: fileType,
        });

        // Generate a presigned URL valid for 60 seconds
        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return res.json({ url, key });
    } catch (error) {
        console.error("S3 Sign Error:", error);
        return res.status(500).json({ error: 'Error generating presigned URL' });
    }
};
