export interface S3EventRecord {
  s3: {
    bucket: {
      name: string;
    };
    object: {
      key: string;
    };
  };
}
