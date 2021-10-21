import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StrangulatorService {

  constructor() { }

  analyzePutSpreads(ticker: string, putExpirationMap: any, underlyingData: any) {

    console.log('analyzing spreads for: ', ticker, putExpirationMap);

    // loop through expiration tables
    Object.entries(putExpirationMap).forEach( ([expirationString, puts]) => {
      
      console.log(ticker + 'expirationString: ', expirationString);
      console.log(ticker + ' puts: ', puts);
      
      // loop through strikes for a given expiration cycle
      // Object.entries(puts).forEach( ([strike, put], entryIndex) => {
        
      //   console.log(ticker + 'strike: ', strike);
      //   console.log(ticker + ' put: ', put);
      
      //   if (puts)
      
      // })
      
      const strikes = Object.keys(puts)

      for (var i = 0; i < strikes.length; i++) {
        
        const strike = strikes[i];

          console.log(ticker + ' strike: ', strike);
          console.log(ticker + ' put: ', puts[strike]);

          console.log(ticker + ' next put: ', strikes[i+1])

          if (strikes[i+1]) {

            // long put (lower strike)

            console.log(ticker + ' -- lower strike: ' + puts[strikes[i]][0].strikePrice)
            console.log(ticker + ' -- lower strike theta: ' + puts[strikes[i]][0].theta)

            const higherStrikePutBidAskMidpoint = (puts[strikes[i]][0].ask + puts[strikes[i]][0].bid) / 2
            
            console.log(ticker + ' -- higher strike bid: ' + puts[strikes[i]][0].bid )
            console.log(ticker + ' -- higher strike ask' + puts[strikes[i]][0].ask )
            console.log(ticker + ' -- higher strike bid/ask midpoint: ' + higherStrikePutBidAskMidpoint)

            // short put (higher strike)
            
            console.log(ticker + ' -- higher strike: ' + puts[strikes[i+1]][0].strikePrice)
            console.log(ticker + ' -- higher strike theta: ' + puts[strikes[i+1]][0].theta)

            const lowerStrikePutBidAskMidpoint = (puts[strikes[i+1]][0].ask + puts[strikes[i+1]][0].bid) / 2

            console.log(ticker + ' -- lower strike bid: ' + puts[strikes[i+1]][0].bid )
            console.log(ticker + ' -- lower strike ask' + puts[strikes[i+1]][0].ask )
            console.log(ticker + ' -- lower strike bid/ask midpoint: ' + lowerStrikePutBidAskMidpoint)

            const netTheta = (puts[strikes[i]][0].theta - puts[strikes[i + 1]][0].theta);
            console.log(ticker + ' ----- net theta: ' + netTheta );
            
            const netDelta = (puts[strikes[i]][0].delta - puts[strikes[i + 1]][0].delta);
            console.log(ticker + ' ----- net delta: ' + netDelta );
            
            const netCreditForSpread = lowerStrikePutBidAskMidpoint - higherStrikePutBidAskMidpoint

            console.log(ticker + ' ----- net credit: ' + netCreditForSpread);

            const strikeWidth = puts[strikes[i+1]][0].strikePrice - puts[strikes[i]][0].strikePrice

            console.log(ticker + ' ----- strikeWidth: ' + strikeWidth );

            const maxLoss = strikeWidth - netCreditForSpread
            
            console.log(ticker + ' ----- max loss for spread: ' + maxLoss );
            
            const tomlScore  = netTheta * 10_000 / maxLoss;

            console.log(ticker + ' ----- toml score: ' + tomlScore);

          }

      }

    })
    
  }

  strangulate(callExpDateMap: any, putExpDateMap: any, underlyingLast: number, minAcceptableDelta: number,
    maxAcceptableDelta: number, minAcceptableGamma: number, maxAcceptableGamma: number) {

    const gudOnes = []

    console.log('strangulator be strangulating!');

    console.log({ callExpDateMap })

    // const hardcodedCallExpirationIndex = 0;

    const callExpirationKeys = Object.keys(callExpDateMap);

    Object.keys(callExpDateMap)
      .splice(0, 25)
      .forEach(callExpirationKey => {

        const callCurrentExpirationObj = callExpDateMap[callExpirationKey]
        // console.log(`expiration [${callExpirationKey}] calls: ${callCurrentExpirationObj}`);
        const currentCallExpiration = callExpirationKey;

        const putExpirationKeys = Object.keys(putExpDateMap);

        const putCurrentExpirationObj = putExpDateMap[callExpirationKey]
        // console.log(`expiration [${callExpirationKey}] puts: ${putCurrentExpirationObj}`);

        const callStrikeKeys = Object.keys(callExpDateMap[callExpirationKey]);
        const putStrikeKeys = Object.keys(putExpDateMap[callExpirationKey]);

        // const hardcodedCallStrikeIndex = 5;

        Object.keys(callCurrentExpirationObj).forEach((currentStrike, strikeIndex) => {


          const currentCall = callCurrentExpirationObj[currentStrike][0];
          const currentCallStrike = callStrikeKeys[strikeIndex];

          // const currentPut = putCurrentExpirationObj[putStrikeKeys[0]][0];

          // console.log('call with lowest strike: ', currentCall);

          if (this.hasNanGreeks(currentCall)) {
            // console.log('looks like call has bad greeks... ', currentCall.delta, ' ', currentCall.gamma, ' ', currentCall.theta)
          }
          else {
            // console.log('finding puts to match the call...')

            // only compare to puts of the SAME expiration cycle and which have a lower or equal strike.

            // console.log(`want to find puts for expiration: ${currentCallExpiration}, for strike: ${currentCallStrike}`)

            const putExpirationMapForCurrentCallExpiration = putExpDateMap[currentCallExpiration]

            // console.log(`put object with that expiration cycle: ${currentCallExpiration}, for strike: ${currentCallStrike}`)
            // console.log({ putExpirationMapForCurrentCallExpiration })

            const things = Object.entries(putExpirationMapForCurrentCallExpiration).map(([strike, putOptionArr]) => {

              // console.log('currentCallStrike: ', currentCallStrike, ', currentPutStrike', strike)

              const currentPut = putOptionArr[0]

              if (+strike > +currentCallStrike) {
                // console.log(`ignoring put with strike ${strike} because it is larger than call strike ${currentCallStrike}...`)
              }
              else {

                if (this.hasNanGreeks(currentPut)) {
                  // console.log('looks like put has bad greeks... ', currentPut.delta, ' ', currentPut.gamma, ' ', currentPut.theta)
                }
                else {

                  // console.log(`calculating greeks for expiration: ${currentCallExpiration}, call strike: ${currentCallStrike}, put strike: ${strike}!`)

                  const netGreeks = {
                    delta: currentCall.delta + currentPut.delta,
                    minDelta: minAcceptableDelta,
                    maxDelta: maxAcceptableDelta,
                    gamma: currentCall.gamma + currentPut.gamma,
                    minGamma: minAcceptableGamma,
                    maxGamma: maxAcceptableGamma,
                    theta: currentCall.theta + currentPut.theta,
                  }

                  // console.log('and the net greeks are...');
                  // console.table(netGreeks);

                  if (netGreeks.delta > minAcceptableDelta && netGreeks.delta < maxAcceptableDelta &&
                    netGreeks.gamma > minAcceptableGamma && netGreeks.gamma < maxAcceptableGamma) {

                    const buyingPowerEffect = this.calculateBuyingPowerEffect(
                      underlyingLast,
                      +currentCallStrike,
                      +strike,
                      +currentCall.last,
                      +currentPut.last
                    )

                    const readableTheta = netGreeks.theta * 100

                    const thetaPower = readableTheta / buyingPowerEffect * 100;

                    console.log('call desc: ', currentCall.description)
                    const symbol = currentCall.description.slice(0, currentCall.description.indexOf(' '))

                    gudOnes.push({
                      symbol,
                      underlyingLast,
                      netDelta: netGreeks.delta * 100,
                      netGamma: netGreeks.gamma * 100,
                      netTheta: readableTheta,
                      callExpiration: currentCallExpiration,
                      callStrike: +currentCallStrike,
                      putExpiration: currentCallExpiration,
                      putStrike: +strike,
                      buyingPowerEffect,
                      thetaPower
                    })
                  }
                }
              }
            })
          }
        })
      })

    const gudOnesSorted = gudOnes.sort((a, b) => a.thetaPower > b.thetaPower ? 1 : -1)
    console.log(gudOnesSorted.length)
    console.log('done calculating!')

    return gudOnesSorted;

  }

  private calculateBuyingPowerEffect(underlyingLast: number, callStrike: number, callPrice: number, putStrike: number, putPrice: number) {
    /**
      * 
      *  Tastyworks short strangle margin req:
      * 
      *   The margin requirements for a short straddle/strangle is the greater of the two sides' short uncovered margin requirement plus the premium of the other leg. 
      *       *The premium received from the sale of the strangle may be applied to the initial margin requirement. 
      * 
      *    ie. it's EITHER (higher of the two) the bpe of call + premium of put
      * 
      *    OR
      * 
      *    the bpe of the put + premium of the call
      */

    // All short options have a minimum BPE of $250
    const min250 = 250

    // Call Option Calcs
    
    const callAmountOTM = callStrike - underlyingLast;
    
    const callBpe20PercentRule = (0.2 * underlyingLast - callAmountOTM) * 100
    
    const callBpe10PercentRule = 0
    
    const callBpePlus50Rule = 0
    
    const callHighestBpeCalc = Math.max(callBpe20PercentRule, callBpe10PercentRule, callBpePlus50Rule, min250);
    
    // Put Option Calcs

    const putAmountOTM = underlyingLast - putStrike;

    const putBpe20PercentRule = (0.2 * underlyingLast - putAmountOTM) * 100

    const putBpe10PercentRule = 0

    const putBpePlus50Rule = 0

    const putHighestBpeCalc = Math.max(putBpe20PercentRule, putBpe10PercentRule, putBpePlus50Rule, min250);

    // Strangle BPE calc!

    const bpe = callHighestBpeCalc > putHighestBpeCalc ?
      callHighestBpeCalc + putPrice :
      putHighestBpeCalc + callPrice

    return bpe;

    // const callBpe = 0.20 * underlyingLast - Math.abs(callStrike - underlyingLast);
    // const callBpePlusPutPrem = callBpe + putPrice;

    // const putBpe = 0.20 * underlyingLast - Math.abs(putStrike - underlyingLast);
    // const putBpePlusCallPrem = putBpe + callPrice;

    // const buyingPowerEffect = Math.max(callBpePlusPutPrem, putBpePlusCallPrem);

    // const buyingPowerEstimate = netGreeks.theta * 100 / sumOfMarks;
  }

  private hasNanGreeks(currentCallOrPut) {

    // console.log('checking option\'s greeks: ', currentCallOrPut)

    if (
      !currentCallOrPut.theta ||
      !currentCallOrPut.delta ||
      !currentCallOrPut.gamma ||
      currentCallOrPut.delta == 'N/A' ||
      currentCallOrPut.delta == 'n/a' ||
      currentCallOrPut.delta == 'Nan' ||
      currentCallOrPut.delta == 'NaN' ||
      currentCallOrPut.gamma == 'N/A' ||
      currentCallOrPut.gamma == 'n/a' ||
      currentCallOrPut.gamma == 'Nan' ||
      currentCallOrPut.gamma == 'NaN' ||
      currentCallOrPut.theta == 'N/A' ||
      currentCallOrPut.theta == 'n/a' ||
      currentCallOrPut.theta == 'Nan' ||
      currentCallOrPut.theta == 'NaN'
    ) {

      // console.log('the greeks are NaN!')
      return true;
    }

    return false;
  }

}
