<template>
  <Navigation></Navigation>
  <div>

    <div v-if="$route.name === 'register'">
      <div id="register">
        <h1>Register Account</h1>
        <el-form :model="formRegister" ref="formRegister" :rules="rules">
          <el-form-item label="First Name" prop="firstName">
            <el-input v-model="formRegister.firstName"></el-input>
          </el-form-item>
          <el-form-item label="Last Name" prop="lastName">
            <el-input v-model="formRegister.lastName"></el-input>
          </el-form-item>
          <el-form-item label="Email" prop="email">
            <el-input v-model="formRegister.email"></el-input>
          </el-form-item>
          <el-form-item label="Password" prop="password">
            <el-input type="password" v-model="formRegister.password"></el-input>
          </el-form-item>
          <el-form-item id="imageUploader">
            <input type="file" accept="image/jpeg, image/gif, image/png" @change="changeFile($event)">
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="registerUser()">Create</el-button>
            <el-button @click="resetForm('formRegister')">Reset</el-button>
          </el-form-item>
        </el-form>
        <a href="/">Already have an account?</a>
      </div>
    </div>

    <div v-else>
      <div id="home">
        <h1>Login to Site</h1>
        <div v-show="loginError">
          <el-alert
            title="Password and/or email is incorrect"
            type="error"
            center
            show-icon
            :closable=false>
          </el-alert>
        </div>

        <el-form :model="formLogin" ref="formLogin">
          <el-form-item label="Email" prop="email">
            <el-input v-model="formLogin.email"></el-input>
          </el-form-item>
          <el-form-item label="Password" prop="password">
            <el-input type="password" v-model="formLogin.password"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loginUser()">Login</el-button>
            <el-button @click="resetForm('formLogin')">Reset</el-button>
          </el-form-item>
        </el-form>
        <a href="/register">Sign Up</a>
      </div>
    </div>
  </div>
</template>

<script>
  import Navigation from './Navigation';
  const url = "http://localhost:4941/api/v1/";
  export default {
    data() {
      let validateEmail = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('Please input the email'));
        } else {
          if (!(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(this.formRegister.email))) {
            callback(new Error('Please enter a valid email'));
          } else {
            this.$refs.formRegister.validateField('email');
          }
          callback();
        }
      };

      return{
        imageFile: null,
        loginError: false,
        registeringImage: false,
        imageUrl: "",
        formRegister: {
          firstName: "",
          lastName: "",
          email: "",
          password: ""
        },
        formLogin: {
          email: "",
          password: ""
        },
        rules: {
          firstName: [
            { required: true, message: 'Please input first name', trigger: 'blur' },
          ],
          lastName: [
            { required: true, message: 'Please input last name', trigger: 'blur' },
          ],
          email: [
            { required: true, validator: validateEmail, trigger: 'blur'}
          ],
          password: [
            {required: true, message: 'Please input a password', trigger: 'blur'},
            { min: 8, message: 'Length must be at least 8 characters', trigger: 'blur'}
          ]
        },
      }
    },
    mounted() {
      if (sessionStorage.getItem('userId') !== null) {
        this.$router.push('/events');
      }

      if (this.$route.name === 'home') { this.navActiveIndex = '2' }
      if (this.$route.name === 'register') { this.navActiveIndex = '3' }
    },
    methods: {
      registerUser() {
        this.$refs.formRegister.validate((valid) => {
          if (valid) {
            this.axios.post(url + 'users/register', {
              firstName: this.formRegister.firstName,
              lastName: this.formRegister.lastName,
              email: this.formRegister.email,
              password: this.formRegister.password
            })
                .then((response) => {
                  this.registeringImage = true;
                  this.loginUser(this.formRegister.email, this.formRegister.password);
                  console.log(response);
                }, (error) => {
                  console.log(error);
                });
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },

      loginUser(email, password) {
        if (!email) { email = this.formLogin.email; }
        if (!password) { password = this.formLogin.password; }

        this.axios.post(url + 'users/login', {
          email,
          password
        })
        .then((response) => {
          sessionStorage.setItem('userId', response.data['userId']);
          sessionStorage.setItem('token', response.data['token']);
          sessionStorage.setItem('loginStatus', 'true');
          this.loginError = false;

          if (this.registeringImage) {
            this.uploadImage()
          }
          this.$router.push(sessionStorage.getItem('redirect') || '/events');
          sessionStorage.removeItem('redirect');
        }, (error) => {
          this.loginError = true;
          console.log(error);
        })
      },

      resetForm(form) {
        this.$refs[form].resetFields();
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
              URL,
              this.imageFile,
              {headers: headers}
          )
        }
      },
    },

    components: {
      Navigation
    }
  }
</script>

<style scoped>

#home, #register {
  margin: auto;
  min-width: 300px;
  width: 50%;
}

#imageUploader {
  margin-left: 75px;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>