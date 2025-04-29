import polka, { IncomingMessage, ServerResponse, statik, Request } from '@ohos/polka';
import { common } from '@kit.AbilityKit';
import { url } from '@kit.ArkTS';

const app = polka();


export default function startFileServer(context: common.UIAbilityContext) {

  let fileDir = context.filesDir;

  let buildDir = fileDir + '/build/'


  const file = new statik.Server(context, '/');
  // const dir = new statik.Server(context, '/', { gzip: true });

  console.log('zxt', "path", buildDir)

  app
    // .use((req, res, next) => {
    //   dir.serve(req, res, function (e) {
    //     if (e && (e.status === 404)) {
    //       next();
    //     }
    //   });
    // })

    .get('/webapp/.*', (req: IncomingMessage, res: ServerResponse) => {
      file.serveFile(
        req.path, 200, {}, req, res
      ).on("error", (err: Error) => {
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end('not found')
      });
    })
    .get('/file', (req: IncomingMessage, res: ServerResponse) => {
      file.serveFile(
        '/build/logo192.png', 200, {}, req, res
      );
    })
      // https://service.mapplus.com/iserver/services/map-b…eImage.png?z={z}&x={x}&y={y}&width=256&height=256
      // https://service.mapplus.com/iserver/services/map-baidu/rest/maps/normal/zxyTileImage.png?z=1&x=0&y=1&width=256&height=256
      // zxyTileImage type.
    .get('/mserver/services/.*', (req: IncomingMessage, res: ServerResponse) => {
      res.setHeader('Access-Control-Allow-Origin', '*')

      const urlOjb = url.URL.parseURL(req.url, 'http://localhost')
      const x = urlOjb.params.get("x")
      const y = urlOjb.params.get("y")
      const z = urlOjb.params.get("z")
      if(typeof x === 'string' && typeof y === 'string' && typeof z === 'string') {
        const nx = parseInt(x)
        const ny = parseInt(y)
        const nz = parseInt(z)
        const magic = 128
        const folderY = Math.floor(ny / magic)
        const folderX = Math.floor(nx / magic)

        // nz to scale
        // read all scales from config
        // find the nearest scale from the config that smaller than the scale of nz
        // if the scale is the smallest, return the nearest bigger one from the config
        // if the scale is the largest, return 404(that is folder that does not exist)
        // get the z folder name from the config
        // use z folder name as nz

        const parent = '/P_256_4C568DE0FIX/'
        const path = `${nz}/${folderY}/${folderX}/${ny}x${nx}.png`

        console.log('zxt', 'local path', parent + path)

        file.serveFile(
          parent + path, 200, {}, req, res
        ).on("error", (err: Error) => {
          res.writeHead(404, { 'Content-Type': 'text/html' })
          res.end('not found')
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end('not found')
      }
      // file.serveFile(
      //   '/test/build/logo192.png', 200, {}, req, res
      // );
    })
    // .get('/upload', (req: IncomingMessage, res: ServerResponse) => {
    //   res.writeHead(200, {
    //     'Content-Type': statik.mime.getType('.html')
    //   });
    //   res.end(fileUploadHtml);
    // })
    // .post('/upload', (req: IncomingMessage, res: ServerResponse) => {
    //   let keys = Array.from(req.files.keys());
    //   let bufLength = req.files.get(keys[0]).buffer.byteLength;
    //   let writeLength = createFile(context.filesDir, req.parameters.get(keys[0])[0], req.files.get(keys[0]).buffer);
    //   if (bufLength === writeLength) {
    //     res.writeHead(200, {
    //       'Content-Type': 'text/plain',
    //     });
    //     res.end('upload success!');
    //   } else {
    //     res.writeHead(200, {
    //       'Content-Type': 'text/plain',
    //     });
    //     res.end('upload failure!');
    //   }
    // })
    // .listen(9990, '0.0.0.0', () => {
    //   // ...
    // });
    .listen(9999)
}

interface ICoord {
  x: number
  y: number
  z: number
}

// function getCoordFromUrl(url: string): ICoord {
//
//   const reg = new RegExp(/.*\/mserver\/services\/(.*)\/rest\/maps\/(.*)\/zxyTileImage.(.*)/)
//
//
//   const url =
//
// }


// function handleImage(url, req: IncomingMessage, res: ServerResponse)