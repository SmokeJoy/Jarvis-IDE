import { McpMarketplaceCatalog, McpResource, McpResourceTemplate } from '../shared/mcp';

interface McpResourceTemplateWithUri extends McpResourceTemplate {
  uriTemplate: string;
}

interface McpResourceWithUri extends McpResource {
  uri: string;
}

interface McpMarketplaceItem {
  mcpId: string;
}

export function getUriFromTemplate(
  template: McpResourceTemplateWithUri,
  params: Record<string, string>
): string {
  const pattern = String(template.uriTemplate);
  return pattern.replace(/\{([^}]+)\}/g, (_, key) => params[key] || '');
}

export function findResourceByUri(
  resources: McpResourceWithUri[],
  uri: string
): McpResourceWithUri | undefined {
  const exactMatch = resources.find((resource) => resource.uri === uri);
  return exactMatch;
}

export function findCatalogItemByServer(
  mcpMarketplaceCatalog: McpMarketplaceCatalog,
  serverName: string
): McpMarketplaceItem | undefined {
  const catalogItem = mcpMarketplaceCatalog.items.find(
    (item: McpMarketplaceItem) => item.mcpId === serverName
  );
  return catalogItem;
}
