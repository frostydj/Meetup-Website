<template>
  <Navigation></Navigation>

  <div>
    <div class="formEdit" v-if="detailEditMode">
      <h2>Edit Details</h2>
      <el-container>
        <el-main>
          <el-alert
              title="Email is already in use"
              type="error"
              center
              show-icon
              :closable=false
              v-show="emailError">
          </el-alert>
          <el-form :model="detailForm" ref="detailForm" :rules="detailRules">
            <el-form-item label="First Name" prop="firstName">
              <el-input v-model="detailForm.firstName" clearable></el-input>
            </el-form-item>
            <el-form-item label="Last Name" prop="lastName">
              <el-input v-model="detailForm.lastName" clearable></el-input>
            </el-form-item>
            <el-form-item label="Email" prop="email">
              <el-input v-model="detailForm.email" clearable></el-input>
            </el-form-item>
            <el-button type="primary" @click="updateDetails('detailForm')">Change Details</el-button>
            <el-button @click="detailEditMode=false; detailForm.firstName = user.firstName; detailForm.lastName = user.lastName; detailForm.email = user.email;">Cancel</el-button>
          </el-form>

        </el-main>
      </el-container>
    </div>

    <div class="formEdit" v-else-if="passwordEditMode">
      <h2>Edit Password</h2>
      <el-container>
        <el-main>
          <el-alert
              title="Password is incorrect"
              type="error"
              center
              show-icon
              :closable=false
              v-show="passwordError">
          </el-alert>
          <el-form :model="passwordForm" ref="passwordForm" :rules="passwordRules">
            <el-form-item label="Current Password" prop="currentPassword">
              <el-input type="password" v-model="passwordForm.currentPassword"></el-input>
            </el-form-item>
            <el-form-item label="New Password" prop="newPassword">
              <el-input type="password" v-model="passwordForm.newPassword"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateDetails('passwordForm')">Change Password</el-button>
              <el-button @click="passwordForm.currentPassword = ''; passwordForm.newPassword = ''; passwordEditMode=false">Cancel</el-button>
            </el-form-item>
          </el-form>
        </el-main>
      </el-container>
    </div>

    <div class="formEdit" v-else-if="imageEditMode">
      <h2>Change Image</h2>
      <input id="imageUploader" type="file" accept="image/jpeg,image/gif,image/png" @change="changeFile($event)"><br><br>
      <el-button type="primary" @click="uploadImage()">Change Image</el-button>
      <el-button @click="imageEditMode=false">Cancel</el-button>
    </div>

    <div v-else>
      <h2>Profile</h2>
      <el-card>
        <el-image class="avatar" :src="getUserImage(userId)">
          <template #error>
            <div class="image-slot">
              <el-image class="avatar" :src="defaultUserImg"></el-image>
            </div>
          </template>
        </el-image>
        <table class="center">
          <tr>
            <td class="left"><b>First Name:</b></td>
            <td class="right">{{ user.firstName }}</td>
          </tr>
          <tr>
            <td class="left"><b>Last Name:</b></td>
            <td class="right">{{ user.lastName }}</td>
          </tr>
          <tr>
            <td class="left"><b>Email:</b></td>
            <td class="right">{{ user.email }}</td>
          </tr>
        </table>
        <el-button plain type="primary" @click="$router.push('/profile/myEvents')">View My Events</el-button>
      </el-card>
    </div>

    <el-button v-if="!detailEditMode" type="text" @click="detailEditMode=true; imageEditMode = false; passwordEditMode=false">Edit Details</el-button>
    <el-button v-if="!passwordEditMode" type="text" @click="passwordEditMode=true; imageEditMode = false; detailEditMode=false">Change Password</el-button>
    <el-button v-if="!imageEditMode" type="text" @click="imageEditMode=true; passwordEditMode=false; detailEditMode=false">Change Image</el-button>
  </div>
</template>

<script>
  const url = "http://localhost:4941/api/v1/";
  import Navigation from './Navigation';
  export default {
    data() {
      let validateEmail = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('Please input the email'));
        } else {
          if (!(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(this.detailForm.email))) {
            callback(new Error('Please enter a valid email'));
          } else {
            this.$refs.detailForm.validateField('email');
          }
          callback();
        }
      };

      return {
        imageFile: null,
        emailError: false,
        passwordError: false,
        detailEditMode: false,
        passwordEditMode: false,
        imageEditMode: false,
        user: "",
        userId: sessionStorage.getItem('userId'),
        defaultUserImg: 'https://i.imgur.com/hepj9ZS.jpg',

        detailForm: {
          firstName: "",
          lastName: "",
          email: "",
        },
        passwordForm: {
          currentPassword: "",
          newPassword: ""
        },
        detailRules: {
          firstName: [
            { required: true, message: 'Please input first name', trigger: 'blur' },
          ],
          lastName: [
            { required: true, message: 'Please input last name', trigger: 'blur' },
          ],
          email: [
            { required: true, validator: validateEmail, trigger: 'blur'}
          ],
        },
        passwordRules: {
          currentPassword: [
            {required: true, message: 'Please input current password', trigger: 'blur'},
          ],
          newPassword: [
            {required: true, message: 'Please input a new password', trigger: 'blur'},
            { min: 8, message: 'Length must be at least 8 characters', trigger: 'blur'}
          ]
        },
      }
    },
    mounted() {
      this.getUser()
    },
    methods: {
      getUser() {
        this.axios.get(url + 'users/' + sessionStorage.getItem('userId'),
            {headers: {'x-authorization': sessionStorage.getItem('token') }})
            .then((response) => {
              this.user = response.data;
              this.detailForm.firstName = this.firstName = this.user.firstName;
              this.detailForm.lastName = this.lastName = this.user.lastName;
              this.detailForm.email = this.email = this.user.email;
            });
      },

      updateDetails(form) {
        this.$refs[form].validate((valid) => {
          if (valid) {
            if (form === 'detailForm') {
              this.patchDetails()
            } else if (form === 'passwordForm') {
              this.patchPassword()
            }
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },

      patchDetails () {
        this.axios.patch(url + 'users/' + sessionStorage.getItem('userId'), {
          firstName: this.detailForm.firstName,
          lastName: this.detailForm.lastName,
          email: this.detailForm.email
        }, {headers: {'x-authorization': sessionStorage.getItem('token')}})
            .then((response) => {
              console.log(response);
              this.emailError = false;
              this.detailEditMode = false;
              this.getUser();
            }, (error) => {
              console.log(error);
              this.emailError = true;
            });
      },

      patchPassword () {
        this.axios.patch(url + 'users/' + sessionStorage.getItem('userId'), {
          password: this.passwordForm.newPassword,
          currentPassword: this.passwordForm.currentPassword
        }, { headers: {'x-authorization': sessionStorage.getItem('token')}})
            .then((response) => {
              console.log(response);
              this.getUser();
              this.passwordError = false;
              this.passwordEditMode = false;
              this.passwordForm.currentPassword = '';
              this.passwordForm.newPassword = ''
            }, (error) => {
              console.log(error);
              this.passwordError = true;
            });
      },

      resetForm(form) {
        this.$refs[form].resetFields();
      },

      getUserImage(id) {
        return url + 'users/' + id + '/image';
      },

      changeFile(event) {
        this.imageFile = event.target.files[0];
      },

      uploadImage() {
        if (this.imageFile !== null) {
          const id = sessionStorage.getItem('userId');
          const headers = {'content-type': this.imageFile.type, 'x-authorization': sessionStorage.getItem('token')}
          const URL = url + 'users/' + id + '/image';

          this.axios.put(
              URL, this.imageFile,
              {headers: headers}
          )

          this.imageEditMode = false
          this.$router.go(0);
        }
      },
    },
    components: {
      Navigation
    }
  }
</script>

<style scoped>
.formEdit {
  margin: auto;
  width: 50%;
  border-style: ridge;
}

.el-card {
  margin: auto;
  width: 50%;
}

#imageUploader {
  margin-left: 75px;
}

.avatar {
  width: 90%;
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