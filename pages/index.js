import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import axios from 'axios'
import { useState, useEffect } from 'react'
import React from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import qs from 'qs';

export default function Home() {
  const [priceaction, getPrice] = useState([])
  const [timeaction, getTime] = useState([])


  const mongokey = "ENTER-YOUR-KEY";

  useEffect(() => {
    const updateChart = setInterval(() => {
      getPricing()
      getChart()
    }, 2000);
    return () => clearInterval(updateChart);
  },
    []);

  async function  getPricing(){
    const zeroxapi = 'https://mumbai.api.0x.org'
    const N2DR = '0xDf64C0B07607183618405BBaA30D1c3558499CC2'
    const N2DUSD = '0x1D9306931843bb1A096057F30bc9296dfa49B5C9'
    const amount = 1 * 10 ** 18;
    console.log("Getting Price");
    const params = {
      sellToken: N2DR,
      buyToken: N2DUSD,
      sellAmount: amount,
    }
    const response = await fetch(zeroxapi +`/swap/v1/price?${qs.stringify(params)}`);
    const swapPriceJSON = await  response.json();
    const priceraw = Number(swapPriceJSON.price).toFixed(6)
    const price = Number(priceraw)
    const fetchtime = new Date()
    const time = fetchtime.getHours() + ":" + fetchtime.getMinutes()
    const comparePrice = axios.post("https://data.mongodb-api.com/app/data-oumzz/endpoint/data/v1/action/findOne",
    {
      collection: "marker",
      database: "ERC20-Chart",
      dataSource: "Cluster0",
      filter: {
        marker: "marker",
      },
    },
    {
      "Content-Type": "application/json",
      "api-key": mongokey,
    }
  ).catch((error) => {
    console.log('Call failed:' + error)
  })
  let fromoutput = await comparePrice.catch((error) => {
    console.log(error)
  })
  let lastprice = Number(fromoutput.data.document.price)
  if (price === lastprice){
    console.log('no changes')
    return;
  }
  else {
    axios.post("https://data.mongodb-api.com/app/data-oumzz/endpoint/data/v1/action/insertOne",
      {
        collection: "chart-action",
        database: "ERC20-Chart",
        dataSource: "Cluster0",
        document: {
          updateprice: price,
          timedate: time
        },
      },
      {
        "Content-Type": "application/json",
        "api-key": mongokey,
      }
    ).catch((error) => {
      console.log('Call failed:' + error)
    })
    axios.post("https://data.mongodb-api.com/app/data-oumzz/endpoint/data/v1/action/updateOne",
        {
          collection: "marker",
          database: "ERC20-Chart",
          dataSource: "Cluster0",
          filter: {
            marker: "marker",
          },
          update: {
            $set: {
              price: price
            }
          },
        },
        {
          "Content-Type": "application/json",
          "api-key": mongokey,
        }
      ).catch((error) => {
        console.log('Call failed:' + error)
      })
    }
}

async function getChart() {
  const output = axios.post("https://data.mongodb-api.com/app/data-oumzz/endpoint/data/v1/action/find",
    {
      collection: "chart-action",
      database: "ERC20-Chart",
      dataSource: "Cluster0",
      filter: {},
    },
    {
      "Content-Type": "application/json",
      "api-key": mongokey,
    }
  ).catch((error) => {
    console.log('Call failed:' + error)
  })
  let fromoutput = await output.catch((error) => {
    console.log(error)
  })
  let arrays = fromoutput.data.documents
    let chartprice = []
    let charttime = []
    arrays.forEach(value => {
      chartprice.push(value.updateprice)
      charttime.push(value.timedate)
    })
    getPrice(chartprice)
    getTime(charttime)
  }

  const data = {
    labels: timeaction,
    datasets: [
      {
        fill: false,
        lineTension: 0.1,
        backgroundColor: 'rgba(75,192,192,2.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderDash: [],
        borderDashOffset: 0.1,
        borderJoinStyle: 'miter',
        pointBorderColor: 'rgba(75,192,192,1)',
        pointBackgroundColor: '#fff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgba(75,192,192,1)',
        pointHoverBorderColor: 'rgba(220,220,220,1)',
        pointHoverBorderWidth: 2,
        pointRadius: 2,
        pointHitRadius: 10,
        data: priceaction
      }
    ]
  };

  return (
    <div className={styles.container}>
      <div className={styles.chart}>
      <img src='n2Dex-img.png' style={{width:'200px'}}/>
      <img src='n2dr.png' style={{width:'60px', marginRight:'4px'}}/><h3>/</h3><img src='n2USD.png' style={{width:'70px', marginLeft:'4px'}}/>
      </div>
      <Line
      data={data}
    />
    </div>
  )
}
