export default {
  root: 'src/',
  publicDir: '../static/',
  base: '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true
  }
}