import useSWR from 'swr';
import { PolicyResponse } from '@/types/policy';

// Import images
import imgA from '@/assets/A.webp';
import imgB from '@/assets/B.webp';
import imgC from '@/assets/C.webp';
import imgD from '@/assets/D.webp';

const fetcher = async (url: string) => {
    // Dynamic import for data
    const path = url.replace('/data/policy/', '').replace('.json', '');
    const [level, slug] = path.split('/');
    
    try {
        const module = await import(`../data/policy/${level}/${slug}.json`);
        return module.default;
    } catch (e) {
        console.error("Failed to load policy data", e);
        throw e;
    }
};

export const usePolicy = (level: number, slug: string) => {
    const key = slug ? `/data/policy/${level}/${slug}.json` : null;
    const { data, error, isLoading } = useSWR<PolicyResponse>(
        key,
        fetcher
    );

    return {
        policy: data?.policy,
        isLoading,
        isError: error,
    };
};

// Helper for initial root nodes
export const INITIAL_NODES = [
    { slug: 'A', level: 1, title: 'ปฏิรูปรัฐและระบบราชการ', image: imgA },
    { slug: 'B', level: 1, title: 'ประชาธิปไตยและความมั่นคงใหม่', image: imgB },
    { slug: 'C', level: 1, title: 'คุณภาพชีวิต', image: imgC },
    { slug: 'D', level: 1, title: 'โมเดลเศรษฐกิจใหม่', image: imgD },
];
