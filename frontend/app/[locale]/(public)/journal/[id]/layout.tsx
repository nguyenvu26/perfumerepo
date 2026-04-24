import { journalService } from '@/services/journal.service';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const journal = await journalService.getById(id);
        if (!journal) return { title: 'Journal Not Found' };
        
        const title = `${journal.title} | PerfumeGPT`;
        const description = journal.excerpt 
            ? journal.excerpt.substring(0, 160) 
            : `Read about ${journal.title} in the PerfumeGPT Fragrance Journal.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: journal.mainImage }],
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [journal.mainImage],
            },
        };
    } catch {
        return { title: 'PerfumeGPT Journal' };
    }
}

export default function JournalDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
