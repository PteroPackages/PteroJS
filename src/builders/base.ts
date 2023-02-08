export abstract class Builder {
    public build() {
        return Object.entries(this).reduce<any>((a, b) => {
            a[b[0]] = b[1];
            return a;
        }, {});
    }
}
