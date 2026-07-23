# @pandacss/mcp

MCP server for Panda CSS AI assistants.

## Usage

```bash
# Start the server (stdio)
npx -y @pandacss/mcp

# Generate client config files
npx -y @pandacss/mcp init --client cursor,claude
```

AI client configs should look like:

```json
{
  "mcpServers": {
    "panda": {
      "command": "npx",
      "args": ["-y", "@pandacss/mcp"]
    }
  }
}
```

`panda mcp` / `panda init-mcp` from `@pandacss/dev` remain as compatibility shims that shell out to this package.
