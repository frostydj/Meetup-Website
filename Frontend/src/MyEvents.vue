<template>
  <Navigation></Navigation>
  <div id="main">
    <div class="actionBanner">
      <el-button plain type="primary" @click="$router.push('/profile/myEvents/create')">Create Event</el-button>
    </div>
    <el-divider></el-divider>
    <div v-if="upcomingEvents.length > 0">
      <h2>Your Upcoming Events</h2>
      <table>
        <tr v-for="event in upcomingEvents" v-bind:key="event.eventId">
          <td>
            <el-card style="margin: auto" shadow="hover" :body-style="{ margin: '10px', padding: '0px' }" @click="$router.push('/events/' + event.eventId);">
              <el-image :src="getEventImage(event.eventId)">
                <template #error>
                  <div class="image-slot">
                    <el-image :src="defaultEventImg"></el-image>
                  </div>
                </template>
              </el-image>
              <div >
                <h2>{{ event.title }}</h2>
                <el-divider><h3>Details:</h3></el-divider>
                <div class="eventDetails">
                  <table class="center">
                    <tr>
                      <td class="left"><b>Categories:</b></td>
                      <td class="right">
                        <ul class="categoryList">
                          <li v-for="category in event.categories" :key="category"><span style="white-space: nowrap">{{ getCategoryName(category) }}</span></li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td class="left"><b>Date:</b></td>
                      <td class="right">{{ formatDate(event.date) }}</td>
                    </tr>
                    <tr>
                      <td class="left"><b>Number of Attendees:</b></td>
                      <td class="right">{{ event.numAcceptedAttendees }}</td>
                    </tr>
                  </table>
                </div>
                <el-divider><h3>Host:</h3></el-divider>
                <div>
                  <table class="center">
                    <td class="left">
                      <el-avatar :src="getUserImageByEvent(event.eventId)">
                        <el-image :src="defaultUserImg"></el-image>
                      </el-avatar>
                    </td>
                    <td>
                      <span>{{ event.organizerFirstName }} {{ event.organizerLastName }}</span>
                    </td>
                  </table>
                </div>
              </div>
            </el-card>
          </td>
        </tr>
      </table>
    </div>

    <el-divider></el-divider>
    <div v-if="hostedEvents.length > 0">
      <h2>Your Hosted Events</h2>
      <table>
        <tr v-for="event in hostedEvents" v-bind:key="event.eventId">
          <td>
            <el-card style="margin: auto" shadow="hover" :body-style="{ margin: '10px', padding: '0px' }" @click="$router.push('/events/' + event.eventId);">
            <el-image :src="getEventImage(event.eventId)">
              <template #error>
                <div class="image-slot">
                  <el-image :src="defaultEventImg"></el-image>
                </div>
              </template>
            </el-image>
            <div >
              <h2>{{ event.title }}</h2>
              <el-divider><h3>Details:</h3></el-divider>
              <div class="eventDetails">
                <table class="center">
                  <tr>
                    <td class="left"><b>Categories:</b></td>
                    <td class="right">
                      <ul class="categoryList">
                        <li v-for="category in event.categories" :key="category"><span style="white-space: nowrap">{{ getCategoryName(category) }}</span></li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td class="left"><b>Date:</b></td>
                    <td class="right">{{ formatDate(event.date) }}</td>
                  </tr>
                  <tr>
                    <td class="left"><b>Number of Attendees:</b></td>
                    <td class="right">{{ event.numAcceptedAttendees }}</td>
                  </tr>
                </table>
              </div>
              <el-divider><h3>Host:</h3></el-divider>
              <div>
                <table class="center">
                  <td class="left">
                    <el-avatar :src="getUserImageByEvent(event.eventId)">
                      <el-image :src="defaultUserImg"></el-image>
                    </el-avatar>
                  </td>
                  <td>
                    <span>{{ event.organizerFirstName }} {{ event.organizerLastName }}</span>
                  </td>
                </table>
              </div>
            </div>
          </el-card>
          </td>
        </tr>
      </table>
    </div>

  </div>
</template>

<script>
import Navigation from "./Navigation";
// const url = "http://csse-s365docker1.canterbury.ac.nz:4001/api/v1/";
const url = "http://localhost:4941/api/v1/";
import moment from 'moment';
export default {
  data() {
    return{
      defaultEventImg: 'https://www.smallwoods.org.uk/assets/Uploads/Documents/ac72cd8e0a/product-default-img__FitMaxWzEwMDAsODAwXQ.jpg',
      defaultUserImg: 'https://i.imgur.com/hepj9ZS.jpg',
      events: [],
      hostedEvents: [],
      upcomingEvents: [],
      categoryList: [],
      attendeeList: [],
      organizerIds: {},
      userId: sessionStorage.getItem('userId'),
      token: sessionStorage.getItem('token'),
    }
  },
  mounted() {
    this.getEvents();
    this.getHostedEvents();
    this.getCategories();
  },
  methods: {
    getEvents() {
      this.axios.get(url + 'events', {
        headers: {'x-authorization': this.token},
      })
          .then((response) => {
            this.getOrganizerIds();
            this.events = response.data;
          }, (error) => {
            this.error = error;
            this.errorFlag = true;
          }).finally(() => {
        this.getUpcomingEvents();
      });
    },

    getUpcomingEvents() {
      this.events.forEach(event => {
        this.axios.get(url + 'events/' + event.eventId + '/attendees', { headers: {'x-authorization' : this.token }})
            .then((response) => {
              response.data.forEach(attendee => {
                if (attendee.attendeeId == this.userId) {
                  this.upcomingEvents.push(event);
                }
              })
            });
      })


    },
    getHostedEvents() {
      this.axios.get(url + 'events', {
        headers: {'x-authorization': this.token},
        params: {organizerId: this.userId}
      })
          .then((response) => {
            this.hostedEvents = response.data;
          }, (error) => {
            this.error = error;
            this.errorFlag = true;
          });
    },
    getCategories() {
      this.axios.get(url + 'events/categories', {
        headers: {'x-authorization': this.token}
      })
          .then((response) => {
            this.categoryList = response.data;
          }, (error) => {
            this.error = error;
            this.errorFlag = true;
          });
    },
    getCategoryName(id) {
      for (let i = 0; i < this.categoryList.length; i++) {
        if (this.categoryList[i].id === id) {
          return this.categoryList[i].name;
        }
      }
    },
    getCategoryId(name) {
      for (let i = 0; i < this.categoryList.length; i++) {
        if (this.categoryList[i].name === name) {
          return this.categoryList[i].id;
        }
      }
    },
    formatDate(date) {
      return moment(date).format('MMMM Do YYYY, h:mm:ss a');
    },

    getEventImage(id) {
      if (!id) {id = this.viewedEventId}
      return url + 'events/' + id + '/image';
    },

    getUserImage(id) {
      return url + 'users/' + id + '/image';
    },

    getUserImageByEvent(id) {
      return url + 'users/' + this.organizerIds[id] + '/image';
    },

    getOrganizerIds() {
      for (let i = 0; i < this.events.length; i++) {
        this.axios.get(url + 'events/' + this.events[i].eventId, { headers: {'x-authorization' : this.token }})
            .then((response) => {
              this.organizerIds[response.data.id] = response.data.organizerId;
            })
      }
    },

  },
  components: {
    Navigation
  }
}
</script>

<style scoped>

.actionBanner {
  margin-top: 20px;
  padding: 20px 20px -20px;
}
#main {
  margin: auto;
  width: 75%;
  border-style: ridge;
}

td {
  vertical-align: middle;
  padding-right: 5px;
  padding-left: 5px;
}

.center {
  margin: auto;
}

.right {
  text-align: left;
}
.left {
  text-align: right;
}

</style>