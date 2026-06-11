import { createApp } from 'vue';
import config from 'devextreme/core/config';
import App from './App.vue';
import './assets/main.css';
import { licenseKey } from './devextreme-license';

config({ licenseKey });

const app = createApp(App);

app.mount('#app');
