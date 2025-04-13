export interface GitCommit {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  date: string;
}
export declare function searchCommits(query: string, cwd: string): Promise<GitCommit[]>;
export declare function getCommitInfo(hash: string, cwd: string): Promise<string>;
export declare function getWorkingState(cwd: string): Promise<string>;
//# sourceMappingURL=git.d.ts.map
