// Plain data so the build can also emit it as FAQPage structured data.
export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Does Pixavo upload images?',
    answer: 'No. Your images are decoded and converted locally in your browser and never sent to a server.',
  },
  {
    question: 'Is Pixavo free?',
    answer: 'Yes. You can use the browser-based converter without an account, subscription, or installation.',
  },
  {
    question: 'Which RAW formats are supported?',
    answer: 'Pixavo supports common camera formats including CR2, CR3, NEF, ARW, RW2, RAF, ORF, PEF, DNG, and RAW. Support can vary by camera model and file variant.',
  },
  {
    question: 'Does conversion affect quality?',
    answer: 'JPEG is a compressed format, but Pixavo gives you direct control over output quality and dimensions so you can choose the right balance for your needs.',
  },
  {
    question: 'Can I convert multiple files?',
    answer: 'Yes. Add multiple images to the queue, convert them as a batch, and download successful results together as a ZIP file.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. Processing stays on your device, so your photos are not stored in a database or exposed through a cloud upload.',
  },
];
