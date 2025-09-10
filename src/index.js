#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const WC = new WooCommerceRestApi({
  url: process.env.WORDPRESS_SITE_URL,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  version: 'wc/v3'
});

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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_products',
        description: 'Get WooCommerce products',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', default: 10 },
            search: { type: 'string' },
            status: { type: 'string' }
          }
        }
      },
      {
        name: 'update_product',
        description: 'Update a WooCommerce product',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            regular_price: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string' }
          },
          required: ['id']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_products':
        const products = await WC.get('products', args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(products.data, null, 2)
          }]
        };

      case 'update_product':
        const { id, ...updateData } = args;
        const updated = await WC.put(`products/${id}`, updateData);
        return {
          content: [{
            type: 'text',
            text: `Product updated: ${JSON.stringify(updated.data, null, 2)}`
          }]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
