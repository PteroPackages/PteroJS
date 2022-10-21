import type { User } from '../structures/User';
import { Builder } from './base';
import { CreateUserOptions } from '../common/app';
import { ValidationError } from '../structures/Errors';

export class UserBuilder extends Builder {
    private externalId: string | undefined;
    private username: string;
    private email: string;
    private firstname: string;
    private lastname: string;
    private password: string | undefined;
    private isAdmin: boolean;

    constructor() {
        super();

        this.externalId = undefined;
        this.username = '';
        this.email = '';
        this.firstname = '';
        this.lastname = '';
        this.password = undefined;
        this.isAdmin = false;
    }

    static fromUser(user: User): UserBuilder {
        let b = new this();

        if (user.externalId) b.setExternalId(user.externalId);
        if (user.username) b.setUsername(user.username);
        if (user.email) b.setEmail(user.email);
        if (user.firstname) b.setFirstname(user.firstname);
        if (user.lastname) b.setLastname(user.lastname);
        if (user.isAdmin) b.setAdmin(user.isAdmin);

        return b;
    }

    setExternalId(id: string | undefined): this {
        this.externalId = id;
        return this;
    }

    setUsername(username: string): this {
        this.username = username;
        return this;
    }

    setEmail(email: string): this {
        this.email = email;
        return this;
    }

    setFirstname(name: string): this {
        this.firstname = name;
        return this;
    }

    setLastname(name: string): this {
        this.lastname = name;
        return this;
    }

    setPassword(password: string | undefined): this {
        this.password = password;
        return this;
    }

    setAdmin(state: boolean): this {
        this.isAdmin = state;
        return this;
    }

    build(): CreateUserOptions {
        if (!this.username) throw new ValidationError('a username is required');
        if (!this.email) throw new ValidationError('an email is required');
        if (!this.firstname)
            throw new ValidationError('a first name is required');
        if (!this.lastname)
            throw new ValidationError('a last name is required');

        return super.build();
    }
}
