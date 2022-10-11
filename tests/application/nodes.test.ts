import { Dict, Node, PteroAPIError, PteroApp } from '../../src';
import auth from '../auth';

const app = new PteroApp(auth.url, auth.key);

describe('Application: Nodes', () => {
    it('fetches all nodes', async () => {
        let nodes = await app.nodes.fetch();

        expect(nodes).toBeInstanceOf(Dict);
        expect(nodes.size).toBeGreaterThan(0);
        for (let [_, n] of nodes) expect(n).toBeInstanceOf(Node);

        nodes = await app.nodes.fetch({ perPage: 3 });
        expect(nodes.size).toBeLessThanOrEqual(3);
    });

    it('fetches a node', () => {
        expect(app.nodes.fetch(0)).rejects.toThrowError(PteroAPIError);
        expect(app.nodes.fetch(2)).resolves.toBeInstanceOf(Node);
        expect(
            app.nodes.query('01', { filter: 'name' }),
        ).resolves.toBeInstanceOf(Dict);
    });

    it('fetches a node configuration', () => {
        expect(app.nodes.getConfig(2)).resolves.toBeDefined();
    });
});
