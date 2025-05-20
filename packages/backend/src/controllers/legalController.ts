/*
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Helper function to read markdown file content
const readLegalDocument = (filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Construct the full path to the markdown file
    // __dirname is the directory of the current module (legalController.ts)
    // Adjust the path according to your project structure if legal_documents is elsewhere
    const filePath = path.join(__dirname, '../legal_documents', filename);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${filename}:`, err);
        reject(new Error(`Failed to read ${filename}`));
        return;
      }
      resolve(data);
    });
  });
};

export const getTermsOfService = async (req: Request, res: Response) => {
  try {
    const termsContent = await readLegalDocument('terms_of_service.md');
    res.status(200).json({ content: termsContent });
  } catch (error) {
    console.error('Error fetching terms of service:', error);
    res.status(500).json({ message: '利用規約の取得中にエラーが発生しました。' });
  }
};

export const getPrivacyPolicy = async (req: Request, res: Response) => {
  try {
    const privacyPolicyContent = await readLegalDocument('privacy_policy.md');
    res.status(200).json({ content: privacyPolicyContent });
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    res.status(500).json({ message: 'プライバシーポリシーの取得中にエラーが発生しました。' });
  }
}; 
*/ 