# Masterdata Import Tool

Ever dreamed of just creating an initial state of the Masterdata service? This tool is the solution! The importer used to initialize the Masterdata service. It executes the necessary commands to create entries and thus enables the preparation of the service. The main purpose is development setups with isolated masterdata instances.

## Configuration

The service is configured via environment variables.

- `URL` Masterdata endpoint, e. g., `http://localhost:3000`
- `USERNAME` Username to access service, e. g., `foo`
- `PASSWORD` Password to access service, e. g., `bar`
- `FORCE` Ignore skipping in case of not empty databases
- `MODEL` YAML-Representation of Model. Root contains templates and documents, templates are organised in tags, metrics and documents. Each can specify as much entries as required. Each entry has to be named! You can reuse this names in any String-attribute to replace identifiers with finally created. For example, a named tag `somethingTag`, can be reused in the metric as reference by using colons and the prefix ref: `:ref.somethingTag:`, the full example would be:

``` yaml
templates:
  tags:
    somethingTag:
      name: "Something"
metrics:
  simpleMetric:
    name: "Simple"
    tags:
      - ":ref.somethingTag:"
```

## Example Model

The following example will create `somethingTag`-Tag-, `simpleMetric`-Metric- and `MyDocTemp`-Document-Templates as well as the Document `example`. Each entry is linked to create a working entry set.

```yaml
templates:
  tags:
    somethingTag:
      name: "Something"
  metrics:
    simpleMetric:
      name: "Simple"
      tags:
        - ":ref.somethingTag:"
  documents:
    myDocTemp:
      name: "MyDocTemp"
      identifier: "id"
      metrics:
        - ":ref.simpleMetric:"
      attributes:
        - name: "id"
          type: "String"
documents:
  example:
    name: "Example"
    template: ":ref.myDocTemp:"
    attributes:
      - name: "id"
        value: "12345"
    metrics:
      - identifier: ":ref.simpleMetric:"
        key: "x"
        tags:
          - identifier: ":ref.somethingTag:"
            value: "wuff"
```

## Usage

This tool is intended to be used within docker-compose files. The following example uses a Masterdata service setup in combination with this init tool to setup this Masterdata instance. After running this with `docker-compose up` you should be able to open `http://localhost:3000/admin/`, enter any credentials (does not matter), and see one entry in tags, metrics, documents as well as the document instance it-self.

``` yaml
version: "3"

services:
  mongodb:
    image: mongo:3.6.5-jessie
    volumes:
      - 'data:/data/db'
  masterdata:
    image: masterdatamgmt/full:latest
    environment:
        PROFILE: dev
        DATABASE: "mongodb://mongodb/masterdata"
        BASEPATH: "http://localhost:3000/"
    volumes:
      - 'img:/var/lib/app/img'
    depends_on:
      - mongodb
    ports:
      - 3000:3000
  init:
    image: masterdatamgmt/importer:latest
    depends_on:
      - masterdata
    environment:
      URL: "http://masterdata:3000/"
      USERNAME: "foo"
      PASSWORD: "bar"
      MODEL: |2
        templates:
          tags:
            somethingTag:
              name: "Something"
          metrics:
            simpleMetric:
              name: "Simple"
              tags:
                - ":ref.somethingTag:"
          documents:
            myDocTemp:
              name: "MyDocTemp"
              identifier: "id"
              metrics:
                - ":ref.simpleMetric:"
              attributes:
                - name: "id"
                  type: "String"
        documents:
          example:
            name: "Example"
            template: ":ref.myDocTemp:"
            attributes:
              - name: "id"
                value: "12345"
            metrics:
              - identifier: ":ref.simpleMetric:"
                key: "x"
                tags:
                  - identifier: ":ref.somethingTag:"
                    value: "wuff"

volumes:
  data:
  img:
```

## Contributing

  [Contributing](CONTRIBUTING.md)

## License

  [MIT](LICENSE)