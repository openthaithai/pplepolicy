export interface PolicyNode {
  id: number;
  slug: string;
  title: string;
  content?: string;
  image?: string;
  type: "Folder" | "File";
  children?: PolicyNode[];
  summary?: string;
  contentBlocks?: ContentBlock[];
  level?: number;
}

export interface ContentBlock {
  type: string;
  content: string;
  title?: string;
  // Add other properties if observed in data
}

export interface PolicyResponse {
  policy: PolicyNode;
}
