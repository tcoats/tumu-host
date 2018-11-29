const jwt = require('jsonwebtoken')
const cert = process.env.TUMU_CERT || "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAo5G5KAoQftneZsamZTsO\nguiMBL4UTF1BUAQswXpznzuUj81zVmwpBWuI2O8n1pqaqEbdxRWmP5leJ1HZ/7TE\nfGlYlo7FHQFO0fY21TUI/W+sZ/ag3bW2LiOUZUi0MYw60nekkFxXPGPWJnWswLXj\nD8v04mfpCHilCtxbdd0Ku9yuCUpiqppTWQsw4+GQTbwUQ7DTtzvvvMgoo/PCuatO\nrIWq5b65RGi5LAaYMd8YhuP8Idc3u2yWVSG/sLAgGCEJarXBPfAfeCj0wmWQ33M3\nNJBLrT1pL4vhaaHX8c/16P2zDNyrbs96jvM0oXr/S7G9UbIjbEKao4iK/wV7urDU\nHBbiERHrUpXUo2Z9wtC/ZDDrE+FVj30qo2jJz27y/rSvgJp7oSgb56OFMyPU8XTA\nds7ta4x0UjZaM7fgCsy0hwrFX1QIirxI8nO/a5DdPiDddpS9vFEvti+Df8HhcCiX\nVW+N5sureKw3d3LQJapnShAsYJ2MbO/7TJFyD6eJGa0qWFEh2fwr1gNNmIA/cIHp\nwHwIgH4kLpP+iig3bGNgdp7pmKJXUZuu70dkdkAwAQ/twZ8wGr9mREVEfABm3Kzt\nDdv2wkNozE/Y2KZqbJAduJHDTFtLPvYBGa8QxS5mGQto7XcCB92ZJis5vxz3PN1s\nu1XEANnYyqMqlMVUs3XmXlsCAwEAAQ==\n-----END PUBLIC KEY-----\n"
const key = process.env.TUMU_KEY || "-----BEGIN RSA PRIVATE KEY-----\nMIIJKAIBAAKCAgEAo5G5KAoQftneZsamZTsOguiMBL4UTF1BUAQswXpznzuUj81z\nVmwpBWuI2O8n1pqaqEbdxRWmP5leJ1HZ/7TEfGlYlo7FHQFO0fY21TUI/W+sZ/ag\n3bW2LiOUZUi0MYw60nekkFxXPGPWJnWswLXjD8v04mfpCHilCtxbdd0Ku9yuCUpi\nqppTWQsw4+GQTbwUQ7DTtzvvvMgoo/PCuatOrIWq5b65RGi5LAaYMd8YhuP8Idc3\nu2yWVSG/sLAgGCEJarXBPfAfeCj0wmWQ33M3NJBLrT1pL4vhaaHX8c/16P2zDNyr\nbs96jvM0oXr/S7G9UbIjbEKao4iK/wV7urDUHBbiERHrUpXUo2Z9wtC/ZDDrE+FV\nj30qo2jJz27y/rSvgJp7oSgb56OFMyPU8XTAds7ta4x0UjZaM7fgCsy0hwrFX1QI\nirxI8nO/a5DdPiDddpS9vFEvti+Df8HhcCiXVW+N5sureKw3d3LQJapnShAsYJ2M\nbO/7TJFyD6eJGa0qWFEh2fwr1gNNmIA/cIHpwHwIgH4kLpP+iig3bGNgdp7pmKJX\nUZuu70dkdkAwAQ/twZ8wGr9mREVEfABm3KztDdv2wkNozE/Y2KZqbJAduJHDTFtL\nPvYBGa8QxS5mGQto7XcCB92ZJis5vxz3PN1su1XEANnYyqMqlMVUs3XmXlsCAwEA\nAQKCAgB2qrADxll1Tia1tYTeiFvcyU1b23Lqe/V4Ua8OpwHfEeCT+1+j4VBZaEyd\n5dOnM/7j+pXF+BDmryPJru5TPxgVkm/8upNymZJPbSsWvyVIiI4x1pGah8wl6RYt\n7PMdxzidnMM9IGEBpQSmXlT4cnzK5xNAdlZwGObT3E5WUgkJhe6VOuweDVxOi3nq\nuahxXPPusAjJNKiW8zfYym4JOakYLNlxWE8cvEUrFZWxCMPIiPpQqsz6IqtmE9f4\nHa8LEly8mCQcBWsvR7damUjjc7knX1An3RfEsNzWP95kxpUHdZdCy41sFQY7U2Jp\njMxOZCKPdIeScTezUMpWfenn5YXbucwZvb1mf8JsNSDjMJWbllhyDtZEJYF/bKzO\nqMZb0wB9c+cSESOPGlfuencDfDBXHimvKOPfr6EgVYmQWgWM/0vofsSVkj5IxQcp\nDRCkI1gKQ9yJEVIgmS+A1hhgn9x2lC2AbR6DMadHu7HjlUaXps5AAHk1e5BgeVbV\nW2+OZBd3TIE/PA9OlKzUh+ZYKcY2aBy+6y+6yTk3riVEXYiT2UViKS8fiWiEHbo8\nkawJY0UjTmL836I91mJq81cDpCLTNQZ1iTp6KAcYaDPJbVeoNiAIClct2uJRV+ig\nWWpfiRf0KzOtXpjHAC8KZejB6WWo/qNhNYRACs5H3N2ShuwTYQKCAQEA1yVtJITQ\nXDo/Sqx0eTWAjFxLgYSZhiuQKOYdK6H7KJTVE0xma0j0bQtStGRfs7HhIBsNURjt\nzXGAjV8cclmD0ceakO0wkHa5bIadSClyHfrQRxVphB7Fdjk3g1hl8e39OmPsX64m\ncAHe24RaM+yX7N7U+spsP3IFfeornGDOzaWZFcGrA4nPLmQ8GVcPdmqOAj3D2i2E\nm0R9xSOS1icmk/nSQ2tqHfElzoadOqDWH2p4cT7GB+VKddYu5ZtM1yDe/mcCQXQZ\nvM7yU4aLw4cQtRTjHY4NmT1fvwE4867Zt4lDezb934zgstPBhueZDX6Pt4xsIn9o\n8CPM/CLbEmdscwKCAQEAwqEQjN2Co4RsZyBxMRR3524ZHBde8AUyjX81RmbLm7eC\n1OtrlRya/KH+6zoBas1UygIIgCbI78UAntNi3tzX16vahYxVbbbrS0H9rM7iUB2/\n1gaWB5jvtxqGEYm0I7P7QtmvVGFAW8p2nzEBr9IZUzkthpo2l7cvAps/tCoUuxxn\nQNfa/cQ+3wP+6qJiJIVYU0nMwuXjAd6EOPev+FgSJWYlP8hlhedS4ItDKuEyVJe1\n7CrArbsTJ++aNWTCooPwy+npbM/RlcGhPJvqAs1Z9rfgMC+IKsPwwlD0UVCmi/g7\nIE9cCUdZgV5MeKKhklCwf/zksG2K7SG1eSfE6qB0eQKCAQAldPyliQIFrJZsV84H\ndEsnJMJ4kC9ybo8wr6+QcykZDaBzNa/3KcJ0Ya5Kfdczn9qEDnGpFuAADqzE8DQx\nrGgI0+mTJdh4rlLmFCG5+I1Hru0oExBF0l2qkZeapH9LOZYG3nK+zcEfaxPzv/08\nYQqqULlf2HI0MZPHMkfZd/lJUHVwlkFB4nJRr13PQ5sLkM2ckkhQ6e/WYHxNID5m\nTnam+K2k00SsZdmhNUqWdH4TBiRmAvnTUhY+ocWUcA9WvQBV5nU8FAyPFLCX3irj\nJdbA0BwifyLa9RaAWKQjuONq0tkO0Koui4ZrW/armBLLiKdY23fQIcKRXIpJs3/U\nmnEFAoIBADP6zi/A7SX8tPLp8DEadVeCyQP+neVejfzKT5Eo3RIOdculwErHpAD6\nxtlN2ZkLk6yL1HddZGbc52iDrjE1LBQ2mpr2Os6dfsPPsQ9ZBYo+F8Dya1lGGCd/\n1vSSIWEzrVRSTQgtHQIm1X14mim54/edGrKLNy9Xxh9dFStp3bWHRXBE9gC2S9BG\nAevqSGnWjxtXZ29Z9EHIiumoBQA/jUEdwa8CN1MGz9SWfO7TzBxZlEWpuWHsx5Xv\n4PCHo4/Byyq6oxPjgOcNGqHURjBPZcqFm0NjPmulfwR2mHmrH3/cYPYlG8CCpL3v\nUF8bmCk6kZjtEqqn5uWkDhJ4c5fyGIkCggEBAJRTASKixdprgqednSFSuZFmII64\nfpizklv7xpgI3DlvLLznJTgs2qCIskDVECE5rgTU0/wzyt6rta6zZd91IL+/P4Km\n47e9nYCdTowBEW1fepkFtIhL7SI4q+hiYQSPfGEfGtSJZET3cT2GOZE0PirrHX78\nkdyZ8M79rpMGOGyM8c9tDCn7xWn9XewN+XKttT1LupQnTnY3EHdapnW2ZLErTrVH\nA+80SHb271CEOk63UpfFy7HbUw0REKZ0p8ZRGhak/TzVtbh4k7oJWAT11AfSMquE\nqOoUkmdH80rjlowCAwXq+wtkQ3+yxJbTrNTGahZiAa2jASREFKP2tXmXVM0=\n-----END RSA PRIVATE KEY-----\n"

module.exports = {
  sign: (payload) => jwt.sign(payload, key, { algorithm: 'RS512'}),
  verify: (token) => jwt.verify(token, cert, { algorithm: 'RS512'})
}