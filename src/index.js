#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const WC = new WooCommerceRestApi({
  url: process.env.WC_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: 'wc/v3'
});

const server = new Server({
  name: 'woocommerce-mcp-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_products',
        description: 'Get WooCommerce products',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', default: 10, maximum: 100 },
            search: { type: 'string' },
            category: { type: 'number' },
            status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'] }
          }
        }
      },
      {
        name: 'get_product',
        description: 'Get a single product by ID',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'number' } },
          required: ['id']
        }
      },
      {
        name: 'update_product',
        description: 'Update product information',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string' },
            short_description: { type: 'string' },
            regular_price: { type: 'string' },
            sale_price: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'] }
          },
          required: ['id']
        }
      },
      {
        name: 'get_categories',
        description: 'Get product categories',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', default: 100 }
          }
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

      case 'get_product':
        const product = await WC.get(`products/${args.id}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(product.data, null, 2)
          }]
        };

      case 'update_product':
        const { id, ...updateData } = args;
        const updated = await WC.put(`products/${id}`, updateData);
        return {
          content: [{
            type: 'text',
            text: `Product ${id} updated successfully: ${JSON.stringify(updated.data, null, 2)}`
          }]
        };

      case 'get_categories':
        const categories = await WC.get('products/categories', args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(categories.data, null, 2)
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
