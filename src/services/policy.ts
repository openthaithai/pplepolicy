import useSWR from 'swr';
import { PolicyResponse, PolicyNode } from '@/types/policy';

const BASE_URL = '/data/policy';

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
    { slug: 'A', level: 1, title: 'ปฏิรูปรัฐและระบบราชการ' },
    { slug: 'B', level: 1, title: 'ประชาธิปไตยและความมั่นคงใหม่' },
    { slug: 'C', level: 1, title: 'คุณภาพชีวิต' },
    { slug: 'D', level: 1, title: 'โมเดลเศรษฐกิจใหม่' },
];
