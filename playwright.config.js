import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'**/*.spec.js',use:{baseURL:'http://127.0.0.1:5173',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}}});
