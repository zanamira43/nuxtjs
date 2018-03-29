import Vuex from 'vuex'
import Cookie from 'js-cookie'

const createStore = () => {
    return new Vuex.Store({
        state: {
            loadedPosts: [],
            token: null
        },
        mutations: {
            setPosts(state, posts) {
                state.loadedPosts = posts
            },
            addPost(state, post) {
                state.loadedPosts.push(post)
            },
            editPost(state, editedPost) {
                const postIndex = state.loadedPosts.findIndex(post => podst.id === editedPost.id)
                state.loadedPosts[postIndex] = editedPost
            },

            setToken(state, token) {
                state.token = token
            },
            clearToken(state) {
                state.token = null
            }

        },
        actions: {
            nuxtServerInit(vuexContext, context) {
                return context.app.$axios
                    .$get('/posts.json')
                    .then(data => {
                        const postArrry = []
                        for (const key in data) {
                            postArrry.push({...data[key], id: key })
                        }
                        vuexContext.commit('setPosts', postArrry)
                    }).catch(e => context.error(e))
            },
            addPost(vuexContext, post) {
                const createdPost = {
                    ...post,
                    updated: new Date()
                }
                return this.$axios.$post('/posts.json?auth=' + vuexContext.state.token, createdPost)
                    .then(data => {
                        vuexContext.commit('addPost', {...createdPost, id: data.name })

                    }).catch(e => console.log(e))
            },
            editPost(vuexContext, editedPost) {
                return this.$axios.$put('/posts/' +
                        editedPost.id +
                        '.json?auth=' + vuexContext.state.token, editedPost)
                    .then(res => {
                        vuexContext.commit('editPost', editedPost)
                    })
                    .catch(e => console.log(e))
            },
            setPosts(vuexContext, posts) {
                vuexContext.commit('setPosts', posts)
            },
            authenticatedUser(vuexcontext, authData) {
                let authURL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' + process.env.fbAPIKey

                if (!authData.isLogin) {
                    authURL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=' + process.env.fbAPIKey
                }

                return this.$axios.$post(authURL, {
                    email: authData.email,
                    password: authData.password,
                    returnSecureToken: true
                }).then(result => {
                    vuexcontext.commit('setToken', result.idToken)
                    localStorage.setItem('token', result.idToken)
                    localStorage.setItem("tokenExpiration", new Date().getTime() + Number.parseInt(result.expiresIn) * 1000)
                    Cookie.set('jwt', result.idToken)
                    Cookie.set('expirationDate', new Date().getTime() + Number.parseInt(result.expiresIn) * 1000)
                    return this.$axios.$post('http://localhost:3000/api/track-data', { data: 'Authenticated!' })
                }).catch(e => console.log(e))

            },
            initAuth(vuexcontext, req) {
                let token
                let expirationDate

                if (req) {
                    if (!req.headers.cookie) {
                        return;
                    }
                    const jwtCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith('jwt='))

                    if (!jwtCookie) {
                        return;
                    }
                    token = jwtCookie.split('=')[1]
                    expirationDate = req.headers.cookie.split(';').find(c => c.trim().startsWith('expirationDate=')).split('=')[1]
                } else {
                    token = localStorage.getItem("token")
                    expirationDate = localStorage.getItem("tokenExpiration")

                }

                if (new Date().getTime() > +expirationDate || !token) {
                    vuexcontext.dispatch('logout')
                    return;
                }

                vuexcontext.commit('setToken', token)
            },

            logout(vuexcontext) {
                vuexcontext.commit('clearToken')
                Cookie.remove('jwt')
                Cookie.remove('expirationDate')
                if (process.client) {
                    localStorage.removeItem('token')
                    localStorage.removeItem('tokenExpiration')
                }

            }
        },
        getters: {
            loadedPosts(state) {
                return state.loadedPosts
            },
            isAuthenticated(state) {
                return state.token != null
            }
        }
    })
}

export default createStore