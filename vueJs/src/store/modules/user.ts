import { VuexModule, Module, Action, Mutation, getModule } from 'vuex-module-decorators'
import UserApiService, { UserLoginData, UserLoginPhoneData } from '@/api/users'
import { CurrentUser } from '@/api/abpconfiguration'
import { getItem, setItem, removeItem } from '@/utils/localStorage'
import { resetRouter } from '@/router'
import { TagsViewModule } from './tags-view'
import { PermissionModule } from '@/store/modules/permission'
import { AbpModule } from '@/store/modules/abp'
import store from '@/store'

export interface IUserState {
  token: string
  refreshToken: string
  id: string | undefined
  name: string | undefined
  surName: string | undefined
  userName: string | undefined
  phoneNumber: string | undefined
  roles: string[]
  email: string | undefined
}

const tokenKey = 'vue_typescript_admin_token'
const refreshTokenKey = 'vue_typescript_admin_refresh_token'

@Module({ dynamic: true, store, name: 'user' })
class User extends VuexModule implements IUserState {
  public token = getItem(tokenKey)
  public refreshToken = getItem(refreshTokenKey)
  public id: string | undefined = ''
  public name: string | undefined = ''
  public surName: string | undefined = ''
  public userName: string | undefined = ''
  public phoneNumber: string | undefined = ''
  public email: string | undefined = ''
  public roles = new Array<string>()

  @Mutation
  private SET_TOKEN(token: string) {
    this.token = token
    setItem(tokenKey, token)
  }

  @Mutation
  private SET_REFRESHTOKEN(token: string) {
    this.refreshToken = token
    setItem(refreshTokenKey, token)
  }

  @Mutation
  private SET_CURRENTUSERINFO(currentUser: CurrentUser) {
    this.id = currentUser.id
    this.name = currentUser.name
    this.email = currentUser.email
    this.surName = currentUser.surName
    this.userName = currentUser.userName
    this.phoneNumber = currentUser.phoneNumber
    this.roles = currentUser.roles
  }

  @Action({ rawError: true })
  public RefreshCurrentUser() {
    this.SET_CURRENTUSERINFO(AbpModule.configuration.currentUser)
  }

  @Action({ rawError: true })
  public async Login(userInfo: { username: string, password: string}) {
    const userLoginData = new UserLoginData()
    userLoginData.userName = userInfo.username
    userLoginData.password = userInfo.password
    const loginResult = await UserApiService.userLogin(userLoginData)
    const token = loginResult.token_type + ' ' + loginResult.access_token
    this.SET_TOKEN(token)
    this.SET_REFRESHTOKEN(loginResult.refresh_token)
    await this.PostLogin()
  }

  @Action({ rawError: true })
  public async PhoneLogin(userInfo: { phoneNumber: string, verifyCode: string}) {
    const userLoginData = new UserLoginPhoneData()
    userLoginData.phoneNumber = userInfo.phoneNumber
    userLoginData.verifyCode = userInfo.verifyCode
    const loginResult = await UserApiService.userLoginWithPhone(userLoginData)
    const token = loginResult.token_type + ' ' + loginResult.access_token
    this.SET_TOKEN(token)
    this.SET_REFRESHTOKEN(loginResult.refresh_token)
    await this.PostLogin()
  }

  @Action
  public ResetToken() {
    removeItem(tokenKey)
    this.SET_TOKEN('')
  }

  @Action
  public async LogOut() {
    if (this.token === '') {
      throw Error('LogOut: token is undefined!')
    }
    const token = getItem(refreshTokenKey)
    if (token) {
      await UserApiService.userLogout(token)
    }
    this.SET_TOKEN('')
    this.SET_REFRESHTOKEN('')
    this.SET_CURRENTUSERINFO(new CurrentUser())
    removeItem(tokenKey)
    removeItem(refreshTokenKey)
    resetRouter()
    // Reset visited views and cached views
    TagsViewModule.delAllViews()
    PermissionModule.ResetPermissions()
    PermissionModule.ResetRoutes()
  }

  @Action
  public RefreshSession() {
    return new Promise((resolve, reject) => {
      const refreshToken = getItem(refreshTokenKey)
      const token = getItem(tokenKey)
      if (refreshToken) {
        UserApiService.refreshToken(token, refreshToken).then(result => {
          const token = result.token_type + ' ' + result.access_token
          this.SET_TOKEN(token)
          this.SET_REFRESHTOKEN(result.refresh_token)
          return resolve(token)
        }).catch(error => {
          return reject(error)
        })
      } else {
        return resolve('')
      }
    })
  }

  @Action
  private async PostLogin() {
    const abpConfig = await AbpModule.LoadAbpConfiguration()
    this.SET_CURRENTUSERINFO(abpConfig.currentUser)
  }
}

export const UserModule = getModule(User)
