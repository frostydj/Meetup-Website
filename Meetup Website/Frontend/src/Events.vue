<template>
  <Navigation></Navigation>
  <div>
    <div v-if="$route.params.eventId" id="singleEvent">
      <div class="warningBanner" v-if="pastEvent">
        <h3>Event is in the past</h3>
      </div>
      <div class="warningBanner" v-else-if="eventFull">
        <h3>Event is full</h3>
      </div>
      <div class="actionBanner" v-else-if="isOrganizer">
        <div v-if="organizerMenu">
          <el-button plain type="primary" @click="manageAttendees = true; organizerMenu=false;">Manage Attendees</el-button>
          <el-button plain type="primary" @click="organizerMenu=false; $router.push('/events/' + eventDetails.id + '/edit')">Edit Event</el-button>
          <el-popconfirm @confirm="deleteEvent" confirm-button-text="Ok" cancel-button-text="Cancel" icon="el-icon-info" iconColor="red" title="Are you sure to delete this event?">
            <template #reference>
              <el-button plain type="primary">Delete Event</el-button>
            </template>
          </el-popconfirm>
        </div>

        <el-card v-if="manageAttendees" class="box-card" >
          <template #header>
            <div class="card-header">
              <span>Manage Attendees</span>
            </div>
          </template>
          <el-table :data="eventAttendees" :default-sort="{prop: 'status', order: 'descending'}">
            <el-table-column prop="firstName" label="First Name"></el-table-column>
            <el-table-column prop="lastName" label="Last Name"></el-table-column>
            <el-table-column prop="status" label="Status" :filters="[{text: 'accepted', value:'accepted'}, {text: 'pending', value:'pending'}, {text: 'rejected', value:'rejected'}]"
            :filter-method="filterStatus">
              <template #default="scope">
                <el-select v-model="scope.row.status" @change="changeAttendeeStatus(scope.$index, scope.row)">
                  <el-option key="accepted" label="accepted" value="accepted"></el-option>
                  <el-option key="pending" label="pending" value="pending"></el-option>
                  <el-option key="rejected" label="rejected" value="rejected"></el-option>
                </el-select>
              </template>
            </el-table-column>
          </el-table>

          <el-button plain type="primary" @click="manageAttendees = false; organizerMenu=true; viewEvent()">Close</el-button>
        </el-card>
      </div>
      <div class="actionBanner" v-else>
        <el-button v-if="attendanceStatus === 'default'" plain type="primary" @click="joinEvent" >Join Event</el-button>
        <el-button v-if="attendanceStatus === 'pending'" plain type="primary" disabled>Request Pending</el-button>
        <el-button v-if="attendanceStatus === 'rejected'" plain type="primary" disabled>Request Rejected</el-button>
        <el-button v-if="attendanceStatus === 'accepted'" plain type="primary" @click="leaveEvent">Leave Event</el-button>
      </div>
      <el-divider></el-divider>
      <div id="event">
        <el-image v-bind:src="getEventImage()">
          <template #error>
            <div class="image-slot">
              <el-image v-bind:src="defaultEventImg"></el-image>
            </div>
          </template>
        </el-image> <br>
        <h1> {{eventDetails.title}} </h1>
        <el-divider><b>Description</b></el-divider>
        <p id="desc">{{eventDetails.description}}</p>
        <el-divider><b>Categories</b></el-divider>
        <table class="center">
          <tr>
            <td>
              <ul class="categoryList">
                <li v-for="category in eventDetails.categories" :key="category"><span style="white-space: nowrap">{{ getCategoryName(category) }}</span></li>
              </ul>
            </td>
          </tr>
        </table>
        <el-divider><b>Details</b></el-divider>
        <table class="center">
          <tr>
            <td class="left"><b>Date:</b></td>
            <td class="right">{{ formatDate(eventDetails.date) }}</td>
          </tr>
          <tr>
            <td class="left"><b>Attendees:</b></td>
            <td class="right">{{eventDetails.attendeeCount}}</td>
          </tr>
          <tr>
            <td class="left"><b>Capacity:</b></td>
            <td class="right">{{eventDetails.capacity}}</td>
          </tr>
          <tr>
            <td class="left"></td>
            <td class="right"></td>
          </tr>
          <tr v-if="eventDetails.url">
            <td class="left"><b>Url:</b></td>
            <td class="right">{{eventDetails.url}}</td>
          </tr>
          <tr v-if="!eventDetails.isOnline">
            <td class="left"><b>Venue:</b></td>
            <td class="right">{{eventDetails.venue}}</td>
          </tr>
          <tr>
            <td class="left"><b>Fee:</b></td>
            <td class="right">{{eventDetails.fee}}</td>
          </tr>
        </table>


        <span>
          <el-popover placement="top-start" trigger="click" width="400px">
            <template #reference>
              <el-button type="text">View Attendees</el-button>
            </template>
            <el-card class="box-card" >
              <template #header>
                <div class="card-header">
                  <b>Event Attendees</b>
                </div>
              </template>
              <table>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
                <tr v-for="user in eventAttendees" v-bind:key="user.attendeeId">
                  <td>
                    <table class="center">
                      <td class="left">
                        <el-avatar v-bind:src="getUserImage(user.attendeeId)">
                          <el-image v-bind:src="defaultUserImg"></el-image>
                        </el-avatar>
                      </td>
                      <td>
                        <span>{{ user.firstName }} {{ user.lastName }}</span>
                      </td>
                    </table>
                  </td>
                  <td>{{user.status}}</td>
                </tr>
              </table>
            </el-card>

          </el-popover>
          <br>
        </span>
        <el-divider><b>Host</b></el-divider>
        <table class="center">
          <td class="left">
            <el-avatar v-bind:src="getUserImageByEvent(eventDetails.eventId)">
              <el-image v-bind:src="defaultUserImg"></el-image>
            </el-avatar>
          </td>
          <td>
            <span>{{ eventDetails.organizerFirstName }} {{ eventDetails.organizerLastName }}</span>
          </td>
        </table>
        <el-divider></el-divider>
        <div id="similarEvents">
          <h2>Similar Events</h2>
          <table v-if="similarEvents.length > 0">
            <tr v-for="event in similarEvents" v-bind:key="event.eventId">
              <td>
                <el-card shadow="hover" :body-style="{ margin: '10px', padding: '0px' }" @click="viewedEventId = event.eventId; viewEvent(); $router.push('/events/' + event.eventId);">
                  <el-image v-bind:src="getEventImage(event.eventId)">
                    <template #error>
                      <div class="image-slot">
                        <el-image v-bind:src="defaultEventImg"></el-image>
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
                          <el-avatar v-bind:src="getUserImageByEvent(event.eventId)">
                            <el-image v-bind:src="defaultUserImg"></el-image>
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
          <span v-else>No similar Events</span>
        </div>
        <el-divider></el-divider>
        <router-link :to="{ name: 'events' }">Back to Events</router-link>
      </div>
    </div>

    <div v-else id="allEvents">
      <div id="events">
        <div id="query">
          <el-button v-if="token != null" plain type="primary" @click="$router.push('/profile/myEvents/create')">Create Event</el-button>
          <div id="search">
            <form>
              <input v-model="eventQuery" placeholder="Search Events...">
              <input type="submit" value="Search" @click="searchEvents">
            </form>
          </div>
          <div id="filter">
            <span><b>Filter:</b></span>
            <el-checkbox-group id="filterGroup" v-model="filterList" @change="filterEvents">
              <table>
                <tr v-for="category in categoryList" :key="category.id">
                  <td class="right"><el-checkbox class="filterItem"  :label="category.name"></el-checkbox></td>
                </tr>
              </table>
            </el-checkbox-group>
          </div>
          <div id="sort">
            <span><b>Sort:</b></span><br>
            <el-radio-group v-model="sortBy" @change="sortEvents">
              <table>
                <tr>
                  <td class="right"><el-radio label="DATE_ASC">Date Ascending </el-radio></td>
                </tr>
                <tr>
                  <td class="right"><el-radio label="DATE_DESC">Date Descending</el-radio></td>
                </tr>
                <tr>
                  <td class="right"><el-radio label="ALPHABETICAL_ASC">Title, A-Z</el-radio></td>
                </tr>
                <tr>
                  <td class="right"><el-radio label="ALPHABETICAL_DESC">Title, Z-A</el-radio></td>
                </tr>
                <tr>
                  <td class="right"><el-radio label="ATTENDEES_ASC">Attendees Ascending</el-radio></td>
                </tr>
                <tr>
                  <td class="right"><el-radio label="ATTENDEES_DESC">Attendees Descending</el-radio></td>
                </tr>
                <tr>
                  <td class="right"><el-radio label="CAPACITY_ASC">Capacity Ascending</el-radio></td>
                </tr>
                <tr>
                  <td class="right"><el-radio label="CAPACITY_DESC">Capacity Descending</el-radio></td>
                </tr>
              </table>
            </el-radio-group>
          </div>
          <el-button plain type="primary" value="Reset" @click="getEvents">Clear Search/Filters</el-button>
        </div>

        <table v-if="displayedEvents.length > 0">
          <tr v-for="event in displayedEvents" v-bind:key="event.eventId">
            <td>
              <el-card shadow="hover" :body-style="{ margin: '10px', padding: '0px' }" @click="viewedEventId = event.eventId; viewEvent(); $router.push('/events/' + event.eventId);">
                <el-image v-bind:src="getEventImage(event.eventId)">
                  <template #error>
                    <div class="image-slot">
                      <el-image v-bind:src="defaultEventImg"></el-image>
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
                        <el-avatar v-bind:src="getUserImageByEvent(event.eventId)">
                          <el-image v-bind:src="defaultUserImg"></el-image>
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
        <h3 v-else>No results found</h3>

        <el-pagination
          background
          v-model:current-page="currentPage"
          layout="prev, pager, next"
          :page-size="pageSize"
          :total="totalEvents"
          :hide-on-single-page="true"
          @current-change="paginate">
        </el-pagination>
      </div>
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
        attendanceStatus: "default",
        pastEvent: false,
        eventFull: false,
        error: "",
        errorFlag: false,
        isOrganizer: false,
        manageAttendees: false,
        organizerMenu: true,
        statusSelection: null,
        events: [],
        displayedEvents: [],
        categoryList: [],
        eventQuery: "",
        filterList: [],
        filterIdList: [],
        sortBy: "",
        pageSize: 10,
        totalEvents: 0,
        currentPage: 1,
        startIndex: 0,
        viewedEventId: "",
        eventDetails: "",
        eventAttendees: [],
        similarEvents: [],
        organizerIds: {},
        token: sessionStorage.getItem('token'),
        userId: sessionStorage.getItem('userId'),
      }
    },
    mounted() {
      if (this.$route.params.eventId) {
        this.viewedEventId = this.$route.params.eventId;
        this.viewEvent();
        this.axios.get(url + 'events/')
      }
      this.getEvents();
      this.getCategories();
    },
    methods: {
      getEvents() {
        this.currentPage = 1;
        this.eventQuery = "";
        this.sortBy = "";
        this.filterList = [];
        this.filterIdList = [];
        this.axios.get(url + 'events', {
          headers: {'x-authorization': this.token}
        })
            .then((response) => {
              this.events = response.data;
              this.displayedEvents = this.events;
              this.totalEvents = this.events.length;
              this.getOrganizerIds();
              this.paginate();
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
      searchEvents(e) {
        e.preventDefault();
        if (this.eventQuery !== "") {
          this.currentPage = 1;
          this.paginate();
        }
      },
      filterEvents() {
        this.filterIdList = [];
        this.filterList.forEach(category => this.filterIdList.push(this.getCategoryId(category)))
        this.currentPage = 1;
        this.paginate();
      },
      sortEvents() {
        this.currentPage = 1;
        this.paginate();
      },
      paginate() {
        this.startIndex = (this.currentPage - 1) * this.pageSize;
        this.updateDisplayedEvents();
        window.scrollTo(0,0);
      },

      updateDisplayedEvents() {
        let params = {};

        if (this.eventQuery) {
          params['q'] = this.eventQuery;
        }

        if (this.filterIdList) {
          params['categoryIds'] = this.filterIdList;
        }

        if (this.sortBy) {
          params['sortBy'] = this.sortBy;
        }

        this.axios.get(url + 'events', {
          params: params,
          headers: {
            'x-authorization': this.token
          }
        })
            .then((response) => {
              this.totalEvents = response.data.length;
            }, (error) => {
              this.error = error;
              this.errorFlag = true;
            })

        params['startIndex'] = this.startIndex;
        params['count'] = this.pageSize;

        this.axios.get(url + 'events', {
          params: params,
          headers: {
            'x-authorization': this.token
          }
        })
            .then((response) => {
              this.displayedEvents = response.data;
              //this.totalEvents = this.displayedEvents;
            }, (error) => {
              this.error = error;
              this.errorFlag = true;
            })
      },

      getEventImage(id) {
        if (!id) {id = this.eventDetails.id}
        return url + 'events/' + id + '/image';
      },

      getUserImage(id) {
        return url + 'users/' + id + '/image';
      },

      getUserImageByEvent(id) {
        return url + 'users/' + this.organizerIds[id] + '/image';
      },

      viewEvent() {
        this.eventFull = this.pastEvent = false;
        this.attendanceStatus = 'default'
        this.axios.get(url + 'events/' + this.viewedEventId, { headers: {'x-authorization' : this.token }})
        .then((response) => {
          this.eventDetails = response.data;
          if (this.eventDetails.fee == 0) {
            this.eventDetails.fee = 'Free';
          }
          if (this.eventDetails.capacity === null) {
            this.eventDetails.capacity = 'No Limit';
          }
          if (this.eventDetails.attendeeCount == null) {
            this.eventDetails.attendeeCount = 0;
          }

          if (Date.parse(this.eventDetails.date) < Date.now()) {
            this.pastEvent = true;
          }

          if (this.eventDetails.capacity <= this.eventDetails.attendeeCount) {
            this.eventFull = true;
          }

          this.checkHosted()
          this.getSimilarEvents();
          this.getEventAttendees(this.eventDetails.id);
        })
        window.scrollTo(0,0)
      },

      getSimilarEvents() {
        this.axios.get(url + 'events', {
          params: { categoryIds: this.eventDetails.categories },
          headers: {'x-authorization' : this.token }
          })
            .then((response) => {
              this.similarEvents = response.data;

              for (let i = 0; i < this.similarEvents.length; i++) {
                if (this.similarEvents[i].eventId == this.viewedEventId) {
                  this.similarEvents.splice(i, 1);
                }
              }
            })
      },

      getEventAttendees(id) {
        this.axios.get(url + 'events/' + id + '/attendees', { headers: {'x-authorization' : this.token }})
            .then((response) => {
              this.eventAttendees = response.data;
            }).finally(() => {
              this.eventAttendees.forEach(attendee => {
                if (attendee.attendeeId == this.userId) {
                  this.attendanceStatus = attendee.status;
                  return;
                }
              })
        })
      },

      checkHosted() {
        if (this.userId == null) { return }
        this.isOrganizer = false;
        this.axios.get(url + 'events', {
          headers: {'x-authorization': this.token},
          params: {organizerId: this.userId}
        })
            .then((response) => {
              for (let i = 0; i < response.data.length; i++) {
                if (response.data[i].eventId == this.eventDetails.id) {
                  this.isOrganizer = true;
                  return;
                }
              }
            }, (error) => {
              this.error = error;
              this.errorFlag = true;
            });
      },
      filterStatus(value, row) {
        return row.status === value;
      },

      changeAttendeeStatus(index, row) {
        const eventId = this.eventDetails.id;
        const userId = row.attendeeId;
        const status = row.status;
        this.axios.patch(url + `events/${eventId}/attendees/${userId}`, {status}, {headers: {'x-authorization': this.token}})
        .then(() => {
          this.getEventAttendees(this.eventDetails.id)
        })
      },

      deleteEvent() {
        this.axios.delete(url + `events/${this.eventDetails.id}`, {headers: {'x-authorization': this.token}})
        .then(() => {
          this.$router.push('/profile/myEvents')
        })
      },

      joinEvent() {
        if (!this.userId) {
          sessionStorage.setItem('redirect', '/events/' + this.eventDetails.id)
          this.$router.push('/');
        } else {
          this.axios.post(url + 'events/' + this.eventDetails.id + '/attendees', {}, {headers: {'x-authorization': this.token}})
            .finally(() => {
              this.viewEvent();
            })
        }
      },

      leaveEvent() {
        this.axios.delete(url + 'events/' + this.eventDetails.id + '/attendees',  {headers: {'x-authorization': this.token}})
            .finally(() => {
              this.viewEvent();
            })
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
  #events ,#singleEvent {
    margin: auto;
    width: 75%;
  }

  #singleEvent {
    border-style: ridge;
  }

  #query {
    padding: 15px;
    float: right;
    width: 300px;
    border-style: groove;
  }

  #desc {
    margin: 0px 50px
  }
  .categoryList {
    text-align: left;
    margin: auto;
    width: 20%;
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  .warningBanner {
    padding: 10px;
    background-color: #fdf6ec;
  }
  .warningBanner > h3 {
    color: #e6a23c;
  }

  #search, #filter, #sort {
    align: left;
    padding: 10px;
    width: 100%
  }

  .actionBanner {
    margin-top: 20px;
    padding: 20px 20px -20px;
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