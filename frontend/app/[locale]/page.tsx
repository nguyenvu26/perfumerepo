import { Metadata } from 'next';
import { HomeContent } from '@/components/sections/home-content';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const isVi = locale === 'vi';
    
    return {
        title: isVi 
            ? 'PerfumeGPT | Nước hoa cao cấp & Tư vấn mùi hương AI' 
            : 'PerfumeGPT | Luxury Fragrance & AI Scent Consultant',
        description: isVi
            ? 'Khám phá mùi hương đặc trưng của bạn với PerfumeGPT. Hệ thống tư vấn nước hoa AI giúp bạn tìm thấy mùi hương hoàn hảo phù hợp với cá tính.'
            : 'Discover your signature scent with PerfumeGPT. Our AI-driven perfume recommendation system helps you find the perfect luxury fragrance.',
        openGraph: {
            title: 'PerfumeGPT',
            description: isVi ? 'Nước hoa cao cấp & Tư vấn mùi hương AI' : 'Luxury Fragrance & AI Scent Consultant',
            url: `https://perfumegpt.site/${locale}`,
            siteName: 'PerfumeGPT',
            images: [
                {
                    url: '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: 'PerfumeGPT Luxury Fragrance',
                },
            ],
            locale: isVi ? 'vi_VN' : 'en_US',
            type: 'website',
        },
    };
}

export default function Home() {
    return <HomeContent />;
}
