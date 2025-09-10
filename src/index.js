#!/usr/bin/env node

console.error('Starting WooCommerce MCP Server...');

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'woocommerce-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lista de herramientas
server.setRequestHandler('tools/list', async () => {
  console.error('Tools list requested');
  return {
    tools: [
      {
        name: 'get_products',
        description: 'Get WooCommerce products',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', default: 5 }
          }
        }
      }
    ]
  };
});

// Llamadas a herramientas
server.setRequestHandler('tools/call', async (request) => {
  console.error(`Tool called: ${request.params.name}`);
  
  return {
    content: [
      {
        type: 'text',
        text: 'WooCommerce server is working! API connection would go here.'
      }
    ]
  };
});

async function main() {
  console.error('Connecting server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Server connected!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
