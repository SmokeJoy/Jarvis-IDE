import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

interface TreeItemProps {
  level: number;
  expanded: boolean;
}

const TreeItem = styled.div<TreeItemProps>`
  display: flex;
  flex-direction: column;
  padding-left: ${(props: TreeItemProps) => `${props.level * 1}rem`};
`;

interface TreeItemHeaderProps {
  expanded: boolean;
}

const TreeItemHeader = styled.div<TreeItemHeaderProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  cursor: pointer;
  user-select: none;
  font-family: var(--vscode-font-family);
  font-size: 14px;
  color: var(--vscode-tree-foreground);

  &:hover {
    background-color: var(--vscode-tree-hoverBackground);
  }
`;

interface TreeItemContentProps {
  expanded: boolean;
}

const TreeItemContent = styled.div<TreeItemContentProps>`
  display: ${(props: TreeItemContentProps) => props.expanded ? 'block' : 'none'};
`;

interface ExpandIconProps {
  expanded: boolean;
}

const ExpandIcon = styled.span<ExpandIconProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transform: ${(props: ExpandIconProps) => props.expanded ? 'rotate(90deg)' : 'none'};
  transition: transform 0.2s ease;
  color: var(--vscode-tree-indentGuidesStroke);
`;

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

interface VSCodeTreeViewProps {
  data: TreeNode[];
  className?: string;
}

export const VSCodeTreeView: React.FC<VSCodeTreeViewProps> = ({
  data,
  className
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <TreeItem key={node.id} level={level} expanded={isExpanded}>
        <TreeItemHeader expanded={isExpanded} onClick={() => toggleNode(node.id)}>
          {hasChildren && (
            <ExpandIcon expanded={isExpanded}>
              ▶
            </ExpandIcon>
          )}
          {node.label}
        </TreeItemHeader>
        {hasChildren && (
          <TreeItemContent expanded={isExpanded}>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </TreeItemContent>
        )}
      </TreeItem>
    );
  };

  return (
    <Container className={className}>
      {data.map(node => renderTreeNode(node))}
    </Container>
  );
}; 