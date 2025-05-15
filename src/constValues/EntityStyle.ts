/*
 * @Author: Yang Shang Long
 * @Date: 2023-11-03 17:01:48
 * @LastEditors: supermapCJ chenjiao@supermap.com
 * @Description: 
 * 
 * Copyright (c) 2023 by SuperMap, All Rights Reserved. 
 */
export default {
  label: {
    color: 'rgba(255,255,255,1)',
    backgroundColor: 'rgba(0,0,0,1)',
    outlineColor: 'rgba(0,0,0,1)',
    fontSize: 20,
    terrSize: 50,
    fixSize: true,
    alwaysVisible: true,
  },
  solidLine: {
    color: 'rgba(0,235,235,.6)',
    lineWidth: 2,
    alwaysVisible: true,
  },
  dashedLine: {
    color: 'rgba(0,235,235,.6)',
    gapColor: 'rgba(255,255,255, 0)',
    lineWidth: 2,
    dashLength: 20,
    alwaysVisible: true,
  },
  contourLine: {
    color: 'rgba(255,255,255,.6)',
    lineWidth: 4,
    outlineWidth: 2,
    outlineColor: 'rgba(0,235,235,1)',
  },
  arrowLine: {
    material: 'rgba(255,0,0,.6)',
    width: 15,
    alwaysVisible: true,
    depthFailShow: true,
  },
  wall: {
    color: 'rgba(0,235,235,.3)',
    wallHeight: 100,
    distanceDisplayCondition: {
      far: 50000000000,
    },
  },
  solidRegion: {
    color: 'rgba(245,158,52,.6)',
    outlineColor: 'rgba(0,235,235,1)',
  },
  griddingRegion: {
    color: 'rgba(235,0,0,.6)',
    cellAlpha: 0.4,
    lineThickness: 1,
    outlineColor: 'rgba(0,235,235,1)',
  },
  stripeRegion: {
    outlineColor: 'rgba(0,235,235,.6)',
    evenColor: 'rgba(255,255,255,1)',
    oddColor: 'rgba(0,126,235,1)',
    repeat: 10,
    orientationHorizontal: true,
    alwaysVisible: true,
  },
}