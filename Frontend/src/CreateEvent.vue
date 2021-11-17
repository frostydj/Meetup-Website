<template>
  <Navigation></Navigation>
  <div>
    <div id="createEventForm">
      <h2 v-if="!editMode">Create Event</h2>
      <h2 v-else>Edit Event</h2>
      <el-form :model="eventForm" ref="eventForm" :rules="rules">
        <el-form-item label="Title" prop="title">
          <el-input v-model="eventForm.title" clearable></el-input>
        </el-form-item>
        <el-form-item label="Categories" prop="categories">
          <el-select v-model="eventForm.categories" placeholder="Select" multiple>
            <el-option v-for="category in categoryList" :key="category.id" :label="category.name" :value="category.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Date" prop="date">
          <el-date-picker v-model="eventForm.date" type="datetime" placeholder="Pick a date" :disabled-date="disableDate" clearable format="DD-MM-YYYY hh:mm:ss a"></el-date-picker>
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="eventForm.description" type="textarea" :autosize="{ minRows: 2, maxRows: 4}"></el-input>
        </el-form-item>
        <el-form-item label="Capacity (set to 0 for no limit)">
          <el-input-number v-model="eventForm.capacity" controls-position="right" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="Online Event">
          <el-switch v-model="eventForm.isOnline" active-text="Online" inactive-text="Offline" @change="eventForm.venue = ''"></el-switch>
        </el-form-item>
        <el-form-item v-if="!eventForm.isOnline" label="Venue" prop="venue">
          <el-input v-model="eventForm.venue" clearable></el-input>
        </el-form-item>
        <el-form-item v-if="eventForm.isOnline" label="Url" prop="url">
          <el-input v-model="eventForm.url" clearable></el-input>
        </el-form-item>
        <el-form-item v-else label="Url">
          <el-input v-model="eventForm.url" clearable></el-input>
        </el-form-item>
        <el-form-item label="Attendance Control Required">
          <el-switch v-model="eventForm.isAttendanceControlled" active-text="Controlled" inactive-text="Not Controlled"></el-switch>
        </el-form-item>
        <el-form-item label="Fee">
          <el-input-number v-model="eventForm.fee" :precision="2" :min="0" :step="0.1"></el-input-number>
        </el-form-item>
        <el-form-item label="Event Image" prop="imageFile">
          <input type="file" accept="image/jpeg,image/gif,image/png" @change="changeFile($event)">
        </el-form-item>
        <el-form-item>
          <el-button v-if="editMode" type="primary" @click="validateForm()">Save Changes</el-button>
          <el-button v-else type="primary" @click="validateForm()">Create</el-button>
          <el-button @click="$refs.eventForm.resetFields(); eventForm.venue = eventForm.url = ''; eventForm.isOnline = eventForm.isAttendanceControlled = false">Reset</el-button>
          <el-button @click="$router.push('/profile/myEvents')">Cancel</el-button>
        </el-form-item>
      </el-form>
    </div>

  </div>
</template>

<script>
import Navigation from './Navigation';
const url = "http://localhost:4941/api/v1/";
export default {
  data() {
    let validateDate = (rule, value, callback) => {
      if (value === null) {
        callback(new Error('Please enter a date'));
      } else {
        if (value <= Date.now()) {
          callback(new Error('Time must be in the future'));
        } else {
          this.$refs.eventForm.validateField('date');
        }
        callback();
      }
    }

    return{
      token: sessionStorage.getItem('token'),
      editMode: false,
      event: {},
      categoryList: [],
      eventForm: {
        title: "",
        categories: [],
        date: "",
        description: "",
        capacity: 0,
        isOnline: false,
        url: "",
        venue: "",
        isAttendanceControlled: false,
        fee: 0,
        imageFile: null,
      },

      rules: {
        title: [
          { required: true, message: "Please enter a title", trigger: 'blur'}
        ],
        categories:  [
          { required: true, message: "Please enter at least category", trigger: 'change'}
        ],
        date:  [
          { required: true, validator: validateDate, trigger: 'change'}
        ],
        description:  [
          { required: true, message: "Please enter a description", trigger: 'blur'}
        ],
        venue: [
          { required: true, message: "Please enter a venue", trigger: 'blur'}
        ],
        url: [
          { required: true, message: "Please enter a url", trigger: 'blur'}
        ],
        imageFile: [
          { required: true, message: "Event image is required", trigger: 'change'}
        ]
      }
    }
  },
  mounted() {
    if (this.$route.name === 'editEvent') {
      this.editMode = true;
      this.getEvent(this.$route.params.eventId);
    }
    this.getCategories();
  },
  methods: {
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
    disableDate(time) {
      return time.getTime() < Date.now() - 3600 * 1000 * 24;
    },

    formatDate(d) {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const date = d.getDate();
      const hour = d.getHours();
      const minutes = d.getMinutes();
      const seconds = d.getSeconds();
      const milliseconds = d.getMilliseconds();
      return `${year}-${month}-${date} ${hour}:${minutes}:${seconds}.${milliseconds}`;
    },

    validateForm() {
      this.$refs.eventForm.validate((valid) => {
        const date = this.formatDate(new Date(this.eventForm.date));
        if (valid) {
          let data = {
            title: this.eventForm.title,
            description: this.eventForm.description,
            categoryIds: this.eventForm.categories,
            date: date,
            isOnline: this.eventForm.isOnline,
            url: this.eventForm.url,
            venue: this.eventForm.venue,
            requiresAttendanceControl: this.eventForm.isAttendanceControlled,
            fee: this.eventForm.fee,
          }

          if (this.eventForm.capacity !== 0) {
            data['capacity'] = this.eventForm.capacity;
          }

          if (this.$route.name === 'editEvent') {
            this.editEvent(data);
          } else {
            this.createEvent(data)
          }
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },

    createEvent(data) {
      this.axios.post(url + 'events', data, {
        headers: {'x-authorization': this.token}
      })
          .then((response) => {
            console.log(response);
            this.uploadImage(response.data.eventId)
            this.$router.push('/profile/myEvents')
          }, (error) => {
            console.log(error);
          });
    },

    getEvent(id) {
      this.axios.get(url + 'events/' + id, { headers: {'x-authorization' : this.token }})
        .then((response) => {
          this.event = response.data
        }).finally(() => {
          console.log(this.event);
          this.eventForm.title = this.event.title;
          this.eventForm.description = this.event.description;
          this.eventForm.categories = this.event.categories;
          this.eventForm.date = this.event.date;
          this.eventForm.isOnline = this.event.isOnline == 1;
          this.eventForm.url = this.event.url;
          this.eventForm.venue = this.event.venue;
          this.eventForm.isAttendanceControlled = this.event.requiresAttendanceControl == 1;
          this.eventForm.fee = parseFloat(this.event.fee);
      })
    },

    editEvent(data) {
      this.axios.patch(url + 'events/' + this.event.id, data, {
        headers: {'x-authorization': this.token}
      })
          .then((response) => {
            console.log(response);
            this.uploadImage(this.event.id)
            this.$router.push('/profile/myEvents')
          }, (error) => {
            console.log(error);
          });
    },

    changeFile(event) {
      this.eventForm.imageFile = event.target.files[0];
    },

    uploadImage(id) {
      if (this.eventForm.imageFile !== null) {
        const headers = {'content-type': this.eventForm.imageFile.type, 'x-authorization': sessionStorage.getItem('token')}
        const URL = url + 'events/' + id + '/image';

        this.axios.put(
            URL, this.eventForm.imageFile,
            {headers: headers}
        )

        this.imageEditMode = false
      }
    },
  },
  components: {
    Navigation
  }
}
</script>

<style scoped>
#createEventForm {
  margin: auto;
  min-width: 300px;
  width: 50%;
}
</style>