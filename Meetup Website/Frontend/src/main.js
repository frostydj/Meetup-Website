import { createApp } from 'vue';
import { createWebHistory, createRouter } from 'vue-router';
import App from './App.vue';
import Home from './Home.vue';
import Events from './Events.vue';
import Profile from './Profile';
import MyEvents from "./MyEvents";
import CreateEvent from "./CreateEvent";
import axios from 'axios';
import ElementPlus from 'element-plus';



const routes = [
    {
        path: "/",
        name: "home",
        component: Home
    },
    {
        path: "/register",
        name: "register",
        component: Home
    },
    {
        path: "/events/:eventId",
        name: "event",
        component: Events
    },
    {
        path: "/events",
        name: "events",
        component: Events
    },
    {
        path: "/profile",
        name: "profile",
        component: Profile
    },
    {
        path: "/profile/edit",
        name: "editProfile",
        component: Profile
    },
    {
        path: "/profile/myEvents",
        name: "myEvents",
        component: MyEvents
    },
    {
        path: "/profile/myEvents/create",
        name: "createEvent",
        component: CreateEvent
    },
    {
        path: "/events/:eventId/edit",
        name: "editEvent",
        component: CreateEvent
    }
];

const router = createRouter({
    routes,
    history: createWebHistory()
});

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.config.globalProperties.axios = axios;
app.mount('#app');


