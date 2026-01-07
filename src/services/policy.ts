import useSWR from 'swr';
import { PolicyResponse, PolicyNode } from '@/types/policy';

const BASE_URL = '/pplepolicy/data/policy';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const usePolicy = (level: number, slug: string) => {
    const { data, error, isLoading } = useSWR<PolicyResponse>(
        slug ? `${BASE_URL}/${level}/${slug}.json` : null,
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
    { slug: 'A', level: 1, title: 'ปฏิรูปรัฐและระบบราชการ', image: '/pplepolicy/A.webp' },
    { slug: 'B', level: 1, title: 'ประชาธิปไตยและความมั่นคงใหม่', image: '/pplepolicy/B.webp' },
    { slug: 'C', level: 1, title: 'คุณภาพชีวิต', image: '/pplepolicy/C.webp' },
    { slug: 'D', level: 1, title: 'โมเดลเศรษฐกิจใหม่', image: '/pplepolicy/D.webp' },
];
