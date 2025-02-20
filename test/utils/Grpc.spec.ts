import path from 'path';
import { InterceptingCall } from '@grpc/grpc-js';
import {
  getGRPCService,
  getAuthInterceptor,
  getMetaInterceptor,
} from '../../milvus';
// mock
jest.mock('@grpc/grpc-js', () => {
  const actual = jest.requireActual(`@grpc/grpc-js`);

  return {
    InterceptingCall: jest.fn(),
    loadPackageDefinition: actual.loadPackageDefinition,
    ServiceClientConstructor: actual.ServiceClientConstructor,
    GrpcObject: actual.GrpcObject,
  };
});

describe(`utils/grpc`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`should return a service client constructor`, () => {
    const protoPath = path.resolve(__dirname, '../../proto/proto/milvus.proto');
    const proto = {
      protoPath,
      serviceName: `milvus.proto.milvus.MilvusService`,
    };
    const service = getGRPCService(proto);
    expect(service).toBeDefined();
  });

  it(`should throw an error if the service object is invalid`, () => {
    const protoPath = path.resolve(__dirname, '../../proto/proto/milvus.proto');
    const proto = {
      protoPath,
      serviceName: `milvus.proto.milvus.MilvusService2`,
    };
    expect(() => getGRPCService(proto)).toThrowError();
  });

  it('should add an authorization header to the metadata of a gRPC call', () => {
    const username = 'testuser';
    const password = 'testpassword';
    const metadata = {
      add: jest.fn(),
    };
    const listener = jest.fn();
    const next = jest.fn();
    const nextCall = jest.fn(() => ({
      start: (metadata: any, listener: any, next: any) => {
        next(metadata, listener);
      },
    }));
    (InterceptingCall as any).mockImplementationOnce(
      (call: any, options: any) => {
        return {
          call,
          options,
          start: options.start,
        };
      }
    );

    const interceptor = getAuthInterceptor({ username, password });
    const interceptedCall = interceptor({}, nextCall);

    (interceptedCall.start as any)(metadata, listener, next);

    expect(metadata.add).toHaveBeenCalledWith(
      'authorization',
      'dGVzdHVzZXI6dGVzdHBhc3N3b3Jk'
    );
  });

  it('should add an authorization header to the metadata of a gRPC call with given token ', () => {
    const token = 'token';
    const metadata = {
      add: jest.fn(),
    };
    const listener = jest.fn();
    const next = jest.fn();
    const nextCall = jest.fn(() => ({
      start: (metadata: any, listener: any, next: any) => {
        next(metadata, listener);
      },
    }));
    (InterceptingCall as any).mockImplementationOnce(
      (call: any, options: any) => {
        return {
          call,
          options,
          start: options.start,
        };
      }
    );

    const interceptor = getAuthInterceptor({ token });
    const interceptedCall = interceptor({}, nextCall);
    (interceptedCall.start as any)(metadata, listener, next);
    expect(metadata.add).toHaveBeenCalledWith('authorization', 'dG9rZW4=');
  });

  it('should add an authorization header to the metadata of a gRPC call with given token username/pass ', () => {
    const token = 'token';
    const username = 'username';
    const password = 'password';
    const metadata = {
      add: jest.fn(),
    };
    const listener = jest.fn();
    const next = jest.fn();
    const nextCall = jest.fn(() => ({
      start: (metadata: any, listener: any, next: any) => {
        next(metadata, listener);
      },
    }));
    (InterceptingCall as any).mockImplementationOnce(
      (call: any, options: any) => {
        return {
          call,
          options,
          start: options.start,
        };
      }
    );

    const interceptor = getAuthInterceptor({ token, username, password });
    const interceptedCall = interceptor({}, nextCall);
    (interceptedCall.start as any)(metadata, listener, next);
    expect(metadata.add).toHaveBeenCalledWith('authorization', 'dG9rZW4=');
  });

  it('adds custom metadata to the gRPC call', () => {
    const meta = [{ key: 'value' }, { key2: 'value2' }];
    const metadata = {
      add: jest.fn(),
    };
    const listener = {};
    const next = jest.fn();

    const nextCall = jest.fn(() => ({
      start: (metadata: any, listener: any, next: any) => {
        next(metadata, listener);
      },
    }));

    (InterceptingCall as any).mockImplementationOnce(
      (call: any, options: any) => {
        return {
          call,
          options,
          start: options.start,
        };
      }
    );

    const interceptor = getMetaInterceptor(meta);
    const interceptedCall = interceptor({}, nextCall);
    (interceptedCall.start as any)(metadata, listener, next);
    expect(metadata.add).toHaveBeenCalledWith('key', 'value');
    expect(metadata.add).toHaveBeenCalledWith('key2', 'value2');
  });
});
