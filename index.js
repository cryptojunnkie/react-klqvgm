import React, { Component } from "react";
import { render } from "react-dom";
import io from "socket.io-client";

import "./style.css";

const R = require("ramda");

const fib = n => {
  if (n <= 2) {
    return 1;
  } else {
    return fib(n - 1) + fib(n - 2);
  }
};

const hexAddress = address => {
  const base58 = address ? address.split("") : [];

  base58[0] = "4";
  base58[1] = "1";

  return base58.join("");
};

let host = "https://betfury.io/";

class App extends Component {
  constructor() {
    super();

    this.state = {
      gain: 0,
      loss: 0,
      losses: 0,
      ready: false,
      total: 0,
      balance: 0,
      count: 1,
      limiter: 0,
      bet: {
        is_under: true,
        prediction: 95,
        amount: 0.1,
        is_token: false,
        currency: "trx"
      },
      strategy: 0
    };

    this.changeStrategy = this.changeStrategy.bind(this);
  }

  componentDidMount() {
    const _state = {
      nonce: null
    };

    this.socket = io(host, {
      reconnect: true,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 3500,
      autoConnect: true,
      transports: ["websocket"]
    });

    this.socket.on("connect", () => {
      this.socket.emit(
        "auth.nonce",
        {
          address: window.tronWeb.defaultAddress.base58,
          currency: "trx",
          referral_id: "TBnByNDEGyi1o7wpHb5j1zjrXocKmN4hJp"
        },
        response => {
          const _state = {
            nonce: response.nonce
          };

          this.setState(
            {
              ...this.state,
              ..._state
            },
            () => {
              console.log("[INFO] Nonce reset.  Please login.");
            }
          );
        }
      );
    });

    this.socket.on("connection", socket => {
      console.log("socket", socket);
    });

    this.setState({
      ...this.state,
      ..._state
    });
  }

  render() {
    return (
      <React.Fragment>
        <div>
          <button
            disabled={!this.state.nonce}
            onClick={() => {
              this.getLogin();
            }}
          >
            Login
          </button>
        </div>
        <div>
          <select onChange={this.changeStrategy}>
            <option value={0}>Default</option>
            <option value={1}>Nomad #1</option>
            <option value={2}>Fanta #2</option>
            <option value={7}>Gnome #1</option>
            <option value={9}>Gnome #2 Over</option>
            <option value={11}>Fanta #1</option>
          </select>
        </div>
        <div>
          <button
            disabled={!this.state.user}
            onClick={() => {
              this.startDice();
            }}
          >
            Start Dice
          </button>
        </div>
        <div>
          <button
            disabled={!this.state.ready}
            onClick={() => {
              this.startRolls();
            }}
          >
            Start Rolls
          </button>
        </div>
        <div>
          <button
            disabled={!this.state.user}
            onClick={() => {
              this.stopRolls();
            }}
          >
            Stop Rolls
          </button>
        </div>
        <div>
          <h2>
            Balance:&nbsp;
            {this.state.balance + this.state.gain - this.state.loss}
            <br />
            <small>Gain:&nbsp;{this.state.gain}</small>
            <br />
            <small>Loss:&nbsp;{this.state.loss}</small>
            <br />
            <small>Total:&nbsp;{this.state.total}</small>
          </h2>
        </div>
        <div>
          <h2>Bet: {this.state.bet.amount}</h2>
        </div>
        <div>
          <h2>
            Betting {this.state.bet.prediction} Under?:{" "}
            {this.state.bet.is_under.toString()}
          </h2>
        </div>
      </React.Fragment>
    );
  }

  changeStrategy(event) {
    const _state = {};

    switch (+event.target.value) {
      case 0:
        const _bet = {
          is_under: true,
          prediction: 95,
          amount: 0.1,
          is_token: false,
          currency: "trx"
        };

        _state.bet = _bet;
        _state.strategy = 0;

        break;
      case 1:
        const _bet = {
          is_under: false,
          prediction: 50,
          amount: 0.2,
          is_token: false,
          currency: "trx"
        };

        _state.bet = _bet;
        _state.strategy = 1;

        break;
      case 2:
        const _bet = {
          is_under: true,
          prediction: 50,
          amount: 0.1,
          is_token: false,
          currency: "trx"
        };

        _state.bet = _bet;
        _state.strategy = 2;

        break;
      case 7:
        const _bet = {
          is_under: true,
          prediction: 20,
          amount: 1,
          is_token: false,
          currency: "trx"
        };

        _state.bet = _bet;
        _state.strategy = 7;

        break;
      case 9:
        const _bet = {
          is_under: false,
          prediction: 20,
          amount: 0.1,
          is_token: false,
          currency: "trx"
        };

        _state.bet = _bet;
        _state.strategy = 9;

        break;
      case 11:
        const _bet = {
          is_under: false,
          prediction: 21,
          amount: .1,
          is_token: false,
          currency: "trx"
        };

        _state.bet = _bet;
        _state.strategy = 11;

        break;
      default:
        break;
    }

    this.setState({
      ...this.state,
      ..._state
    });
  }

  getLogin() {
    (async () => {
      let signed = await window.tronWeb.trx
        .sign(window.tronWeb.toHex(this.state.nonce))
        .catch(error => console.error(error));

      if (signed) {
        console.log("[INFO] Login:", window.tronWeb.defaultAddress.base58);

        this.socket.emit(
          "auth.sign",
          {
            currency: "trx",
            address: window.tronWeb.defaultAddress.base58,
            signature: signed
          },
          response => {
            const user = response.user;

            if (user) {
              const _state = {};
              const balance = R.pathOr(
                0,
                ["currencies", "trx", "balance", "current", "balance"],
                user
              );

              _state.user = user;
              _state.balance = balance;

              this.setState(
                {
                  ...this.state,
                  ..._state
                },
                () => {
                  console.log("[INFO] User authenticated.");
                }
              );
            }
          }
        );
      }
    })();
  }

  getReadyState() {
    return true;
  }

  startDice() {
    this.socket.emit("games.dice.join", {}, response => {
      if (response.error !== undefined) {
        console.error(response.error);

        return;
      }

      if (response.config) {
        console.log("[INFO] Lobby open.");

        const _state = {};
        _state.ready = true;

        this.setState(
          {
            ...this.state,
            ..._state
          },
          () => {
            console.log("[INFO] Autoroller ready.");
          }
        );
      }
    });
  }

  startRolls() {
    const _state = {};
    _state.loop = setInterval(() => {
      if (this.state.ready) {
        this.getRoll();
      }
    }, 3650);

    this.setState({
      ...this.state,
      ..._state
    });
  }

  stopRolls(result) {
    const _state = {};
    _state.ready = false;

    if (this.state.loop) {
      clearInterval(this.state.loop);
    }

    this.setState(
      {
        ...this.state,
        ..._state
      },
      () => {
        console.log("[INFO] Autoroller stopped by user.");
      }
    );
  }

  nextBet(response) {
    const _state = {
      count: this.state.count,
      gain: this.state.gain,
      loss: this.state.loss,
      total: this.state.total
    };
    const result = R.pathOr({}, ["response"], response);
    const _amount = +R.pathOr(0, ["response", "amount"], response);
    let { count, gain, loss } = this.state;

    switch (this.state.strategy) {
      case 0:
        break;
      case 1:
        const betArray = [
          1,
          1,
          1,
          4,
          8,
          16,
          32,
          64,
          128,
          256,
          512,
          1024,
          2048,
          4096,
          8192
        ];
        const { bet } = this.state;

        if (result.winAmount === 0) {
          const maxBet =
            this.state.limiter > 0 &&
            this.state.losses > betArray.length &&
            betArray[betArray.length - 1] >= this.state.limiter
              ? 0.2
              : betArray[betArray.length - 1] * 2;

          const amount =
            this.state.limiter > 0 && _amount >= this.state.limiter
              ? 0.2
              : this.state.losses < betArray.length
              ? betArray[this.state.losses]
              : maxBet;

          const _bet = {
            is_under:
              this.state.losses > 1
                ? [false, true][Math.floor(Math.random() * 2)]
                : !bet.is_under,
            prediction: bet.prediction,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          const loss = +R.pathOr(0, ["response", "amount"], response);
          _state.bet = _bet;
          _state.loss += loss;
          _state.losses = this.state.losses + 1;
        } else if (typeof result.winAmount === "undefined") {
          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: bet.amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          console.log("[WARN] Status needs capturing.", response);
        } else {
          const _bet = {
            is_under: this.state.losses > 0 ? !bet.is_under : bet.is_under,
            prediction: 50,
            amount: 0.2,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          _state.gain += +result.winAmount - _amount;
          _state.losses = 0;
        }

        break;
      case 2:
        const betArray = [
          0.1,
          0.1,
          0.1,
          0.2,
          0.4,
          0.8,
          0.8,
          1.6,
          3.2,
          6.4,
          12.8,
          25.6,
          51.2,
          102.4,
          204.8,
          409.6,
          819.2,
          1638.4,
          3276.4,
          6552.8
        ];
        const { bet } = this.state;

        if (result.winAmount === 0) {
          const maxBet =
            this.state.limiter > 0 &&
            this.state.losses > betArray.length &&
            betArray[betArray.length - 1] >= this.state.limiter
              ? 0.1
              : 0.1;

          const amount =
            this.state.limiter > 0 && _amount >= this.state.limiter
              ? 0.1
              : this.state.losses < betArray.length
              ? betArray[this.state.losses]
              : maxBet;

          const _bet = {
            is_under:
              this.state.losses > 1
                ? [false, true][Math.floor(Math.random() * 2)]
                : !bet.is_under,
            prediction: bet.prediction,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          const loss = +R.pathOr(0, ["response", "amount"], response);
          _state.bet = _bet;
          _state.loss += loss;
          _state.losses = this.state.losses + 1;
        } else if (typeof result.winAmount === "undefined") {
          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: bet.amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          console.log("[WARN] Status needs capturing.", response);
        } else {
          const _bet = {
            is_under: this.state.losses > 0 ? !bet.is_under : bet.is_under,
            prediction: bet.prediction,
            amount: 0.1,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          _state.gain += +result.winAmount - _amount;
          _state.losses = 0;
        }

        break;
      case 7:
        const { bet, betIndex, losses } = this.state;

        if (result.winAmount === 0) {
          const amount = count % 3 === 0 ? bet.amount * 2 : bet.amount;

          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          const loss = +R.pathOr(0, ["response", "amount"], response);

          _state.bet = _bet;
          _state.loss += loss;
          _state.losses = this.state.losses + 1;
        } else if (typeof result.winAmount === "undefined") {
          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: bet.amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;

          console.log("[WARN] Status needs capturing.", response);
        } else {
          const amount =
            losses > 0 ? 0.1 : count % 3 === 0 ? bet.amount * 2 : bet.amount;

          const _bet = {
            is_under: bet.is_under,
            prediction: 20,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          _state.gain += +result.winAmount - _amount;
          _state.losses = 0;
        }

        break;
      case 8:
        const betArray = [
          1.3862943611198906,
          3.2958368660043287,
          5.545177444479562,
          8.047189562170502,
          10.75055681536833
        ];

        break;
      case 9:
        const { bet, betIndex, losses } = this.state;

        if (result.winAmount === 0) {
          const amount =
            losses > 0 && losses % 3
              ? bet.amount * 2
              : count % 3 === 0
              ? bet.amount * 2
              : bet.amount;

          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          const loss = +R.pathOr(0, ["response", "amount"], response);

          _state.bet = _bet;
          _state.loss += loss;
          _state.losses = this.state.losses + 1;
        } else if (typeof result.winAmount === "undefined") {
          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: bet.amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;

          console.log("[WARN] Status needs capturing.", response);
        } else {
          const amount =
            losses > 0 ? 0.1 : count % 3 === 0 ? bet.amount * 2 : bet.amount;

          const _bet = {
            is_under: bet.is_under,
            prediction: 20,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          _state.gain += +result.winAmount - _amount;
          _state.losses = 0;
        }

        break;
      case 10:
        const { bet, betIndex, losses } = this.state;

        if (result.winAmount === 0) {
          const amount =
            losses !== 0 && losses % 3
              ? bet.amount * 2
              : count % 3 === 0
              ? bet.amount * 2
              : bet.amount;

          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          const loss = +R.pathOr(0, ["response", "amount"], response);

          _state.bet = _bet;
          _state.loss += loss;
          _state.losses = this.state.losses + 1;
        } else if (typeof result.winAmount === "undefined") {
          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: bet.amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;

          console.log("[WARN] Status needs capturing.", response);
        } else {
          const amount =
            losses > 0 ? 0.1 : count % 3 === 0 ? bet.amount * 2 : bet.amount;

          const _bet = {
            is_under: losses > 0 ? !bet.is_under : bet.is_under,
            prediction: 20,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          _state.gain += +result.winAmount - _amount;
          _state.losses = 0;
        }

        break;
      case 11:
        const betArray = [
          
          3.2,
          6.4,
          12.8,
          25.6,
          51.2,
          102.4,
          204.8,
          409.6,
          819.2,
          1638.4,
          3276.4,
          6552.8];
        const { bet } = this.state;

        if (result.winAmount === 0) {
          const amount =
            this.state.losses < betArray.length
              ? betArray[this.state.losses]
              : 1;

          const _bet = {
            is_under:
              this.state.losses < betArray.length ? !bet.is_under : false,
            prediction: this.state.losses < betArray.length ? 50 : 21,
            amount: amount,
            is_token: false,
            currency: "trx"
          };

          const loss = +R.pathOr(0, ["response", "amount"], response);
          _state.bet = _bet;
          _state.loss += loss;
          _state.losses = this.state.losses + 1;
        } else if (typeof result.winAmount === "undefined") {
          const _bet = {
            is_under: bet.is_under,
            prediction: bet.prediction,
            amount: bet.amount,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          console.log("[WARN] Status needs capturing.", response);
        } else {
          const _bet = {
            is_under: false,
            prediction: 21,
            amount: .1,
            is_token: false,
            currency: "trx"
          };

          _state.bet = _bet;
          _state.gain += +result.winAmount - _amount;
          _state.losses = 0;
        }

        break;
      default:
        break;
    }

    _state.total += _amount;
    _state.count++;
    _state.ready = this.getReadyState();

    this.setState(
      {
        ...this.state,
        ..._state
      },
      () => {
        console.log("[INFO] Autoroller ready.");
      }
    );
  }

  getRoll() {
    const _state = {};
    _state.ready = false;

    console.log("[INFO] Autoroller paused.");

    this.setState(
      {
        ...this.state,
        ..._state
      },
      () => {
        console.log("[INFO] Bet amount: ", this.state.bet.amount);

        this.socket.emit("games.dice.bet", this.state.bet, response => {
          if (response.error !== undefined) {
            console.error(response.error);
          }

          const result = response.response ? response.response : {};

          if (result.winAmount !== 0) {
            console.log("[WIN] (r) Win amount: ", result.winAmount);
          } else if (result.winAmount === 0) {
            console.log("[LOSS] (r) Loss Amount: ", response.response.amount);
          } else {
            console.log("[INFO] Bet error.", response);
          }

          this.nextBet(response);
        });
      }
    );
  }
}

render(<App />, document.getElementById("root"));
