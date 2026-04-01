# API
## Types

Most of the requests accept JSON. The types are documented as follows:

Curly braces (`{}`) indicate objects, square braces (`[]`) indicate arrays, and
object members are a word followed by a colon and the type of the member.

### UserRequest

```ts
{
    email: string,
    password: string,
}
```

### UserResponse

```ts
{
    id: string,
    email: string,
    createdAt: timestamp,
    updatedAt: timestamp,
    isChirpyRed: boolean,
}
```

### UserAuthResponse

```ts
{
    id: string,
    email: string,
    createdAt: timestamp,
    updatedAt: timestamp,
    isChirpyRed: boolean,
    token: JWT token,
    refreshToken: refresh token,
}
```

### RefreshResponse

```ts
{
    token: string,
}
```

### ChirpResponse

```ts
{
    id: string,
    createdAt: timestamp,
    updatedAt: timestamp,
    body: string,
    userId: string,
}
```

## Endpoints

### User accounts
#### Registration

`POST /api/users`

Takes a `UserRequest` and returns a `UserResponse`

#### Changing email and password

`PUT /api/users`

Takes a `UserRequest` and returns a `UserResponse`

Requires a valid `Authorization` header

### Login and authentication

`POST /api/login`

Takes a `UserRequest` and returns a `UserAuthResponse` if the password is valid

The token is used by setting the `Authorization` header of a request to
`Bearer <token>`

The `refreshToken` is only used by the `/api/refresh` endpoint

#### Refresh JWT token

`POST /api/refresh`

Returns a RefreshResponse with a new JWT if the refresh token is valid

The `Authorization` header must be set to `Bearer <refreshToken>`, where
`<refreshToken>` is a refresh token returned by the `/api/login` endpoint

#### Revoke refresh token

`POST /api/revoke`

Requires a valid refresh token in the `Authorization` header

Responds with a 204 on successful revocation

### Chirps

#### Create a chirp

`POST /api/chirps`

Takes a (non-JSON) string that is the contents of the chirp

Requires a valid `Authorization` header

#### Get chirps

`GET /api/chirps`

Returns an array of `ChirpResponse`s

##### Optional query parameters

###### Filter by author ID
`authorId=<user_id>`

###### Sort
`sort=<"asc"|"desc">`

#### Get chirp by id

`GET /api/chirps/<chirp_id>`

Returns a `ChirpResponse`

#### Delete a chirp

`DELETE /api/chirps/<chirp_id>`

Requires a valid `Authorization` header

Responds with a 204 on successful deletion
