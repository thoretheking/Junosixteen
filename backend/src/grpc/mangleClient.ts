import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(__dirname, '../proto/mangle.proto');
const pkgDef = protoLoader.loadSync(PROTO_PATH, { 
  longs: String, 
  enums: String, 
  defaults: true 
});
const manglePkg: any = grpc.loadPackageDefinition(pkgDef).mangle;

const client = new manglePkg.Mangle(
  process.env.MANGLE_ADDR || 'localhost:8080', 
  grpc.credentials.createInsecure()
);

export function query(query: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    client.Query({ query }, (err: any, resp: { facts: string[] }) => {
      if (err) return reject(err);
      resolve(resp.facts || []);
    });
  });
}

export function update(program: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.Update({ program }, (err: any, resp: { ok: boolean; error?: string }) => {
      if (err) return reject(err);
      if (!resp.ok) return reject(new Error(resp.error || 'update failed'));
      resolve();
    });
  });
} 