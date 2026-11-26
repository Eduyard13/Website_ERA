// Approved rounded equipment-payback outcomes at preset prices and 5% load nodes.
// No investment amounts or interpolated investment formula are distributed.
export const paybackIntervals = {
 "separation": {
  "40000": {
   "90": [
    22.5,
    33.7
   ],
   "95": [
    16.5,
    24.7
   ],
   "100": [
    13,
    19.5
   ]
  },
  "45000": {
   "70": [
    26.2,
    39.4
   ],
   "75": [
    17.1,
    25.6
   ],
   "80": [
    12.6,
    19
   ],
   "85": [
    10,
    15.1
   ],
   "90": [
    8.3,
    12.5
   ],
   "95": [
    7.1,
    10.7
   ],
   "100": [
    6.2,
    9.3
   ]
  },
  "50000": {
   "60": [
    21,
    31.5
   ],
   "65": [
    13.8,
    20.8
   ],
   "70": [
    10.3,
    15.5
   ],
   "75": [
    8.2,
    12.3
   ],
   "80": [
    6.8,
    10.2
   ],
   "85": [
    5.8,
    8.8
   ],
   "90": [
    5.1,
    7.7
   ],
   "95": [
    4.5,
    6.8
   ],
   "100": [
    4.1,
    6.1
   ]
  }
 },
 "full": {
  "80000": {
   "60": [
    39.1,
    48.9
   ],
   "65": [
    27.6,
    34.4
   ],
   "70": [
    21.3,
    26.6
   ],
   "75": [
    17.3,
    21.7
   ],
   "80": [
    14.6,
    18.3
   ],
   "85": [
    12.6,
    15.8
   ],
   "90": [
    11.1,
    13.9
   ],
   "95": [
    9.9,
    12.4
   ],
   "100": [
    9,
    11.2
   ]
  },
  "90000": {
   "50": [
    39.7,
    49.7
   ],
   "55": [
    26.3,
    32.9
   ],
   "60": [
    19.7,
    24.6
   ],
   "65": [
    15.7,
    19.6
   ],
   "70": [
    13.1,
    16.3
   ],
   "75": [
    11.2,
    14
   ],
   "80": [
    9.8,
    12.2
   ],
   "85": [
    8.7,
    10.9
   ],
   "90": [
    7.8,
    9.8
   ],
   "95": [
    7.1,
    8.9
   ],
   "100": [
    6.5,
    8.2
   ]
  },
  "100000": {
   "45": [
    32,
    40
   ],
   "50": [
    21.6,
    27.1
   ],
   "55": [
    16.4,
    20.4
   ],
   "60": [
    13.1,
    16.4
   ],
   "65": [
    11,
    13.7
   ],
   "70": [
    9.4,
    11.8
   ],
   "75": [
    8.3,
    10.3
   ],
   "80": [
    7.4,
    9.2
   ],
   "85": [
    6.6,
    8.3
   ],
   "90": [
    6,
    7.5
   ],
   "95": [
    5.5,
    6.9
   ],
   "100": [
    5.1,
    6.4
   ]
  },
  "110000": {
   "40": [
    30.1,
    37.7
   ],
   "45": [
    19.9,
    24.9
   ],
   "50": [
    14.9,
    18.6
   ],
   "55": [
    11.9,
    14.8
   ],
   "60": [
    9.9,
    12.3
   ],
   "65": [
    8.5,
    10.6
   ],
   "70": [
    7.4,
    9.2
   ],
   "75": [
    6.6,
    8.2
   ],
   "80": [
    5.9,
    7.4
   ],
   "85": [
    5.4,
    6.7
   ],
   "90": [
    4.9,
    6.1
   ],
   "95": [
    4.5,
    5.7
   ],
   "100": [
    4.2,
    5.3
   ]
  }
 }
};

export function equipmentPayback(result){
 if(result.annualOperatingCash<=0)return {status:'unreachable'};
 if(result.equipmentInvestment!=null){
  const months=result.equipmentInvestment/result.averageMonthlyOperatingCash;
  return Number.isFinite(months)?{status:'estimate',months:[months],basis:'operating-cash'}:{status:'individual'};
 }
 // The full-cycle historical outcomes predate the revised feedstock balance.
 if(result.state.mode==='full')return {status:'individual'};
 if(result.yearNet<0)return {status:'review'};
 const percentage=result.load*100,node=Math.round(percentage/5)*5;
 const interval=Math.abs(percentage-node)<1e-7?paybackIntervals[result.state.mode]?.[result.grossPrice]?.[node]:null;
 return interval?{status:'estimate',months:[...interval],load:node}:{status:'individual'};
}
