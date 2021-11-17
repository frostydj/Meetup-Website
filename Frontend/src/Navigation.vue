<template>
  <div id="navbar">
    <el-menu id=#navbar :router="true" mode="horizontal" :default-active="navActiveIndex">
      <el-menu-item index="1" :route="{name: 'events'}">Events</el-menu-item>
      <el-menu-item v-show="!loggedIn" index="2" :route="{name: 'home'}">Login</el-menu-item>
      <el-menu-item v-show="!loggedIn" index="3" :route="{name: 'register'}">Register</el-menu-item>
      <el-menu-item v-show="loggedIn" index="4" :route="{name: 'profile'}">Profile</el-menu-item>
      <el-menu-item v-show="loggedIn" @click="logout">Logout</el-menu-item>
    </el-menu>
  </div>
</template>

<script>
export default {
  data() {
    return {
      navIndexes: {
        'events': "1",
        'event': "1",
        'home': "2",
        'register': "3",
        'profile': "4",
        'myEvents': "4",
        'createEvent': "4",
        'editEvent': "4",
      },
      navActiveIndex: '',
      loggedIn: sessionStorage.getItem('loginStatus'),
    }
  },
  mounted() {
    this.navActiveIndex = this.navIndexes[this.$route.name];
  },
  methods: {
    logout() {
      sessionStorage.clear();
      this.$router.push('/');
    },
  }

}
</script>

<style scoped>

</style>