import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'**/*.spec.js',use:{baseURL:process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173/location-visualizer/',viewport:{width:1440,height:1000},launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}}});
