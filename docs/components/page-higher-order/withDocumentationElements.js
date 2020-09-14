import { MDXProvider } from '@mdx-js/tag';
import GithubSlugger from 'github-slugger';
import { withRouter } from 'next/router';
import * as React from 'react';

import { HeadingManager } from '~/common/headingManager';
import * as components from '~/common/translate-markdown';
import DocumentationPage from '~/components/DocumentationPage';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';

export default meta =>
  withRouter(
    class DocumentationPageHOC extends React.Component {
      render() {
        const { router } = this.props;
        return (
          <HeadingsContext.Provider value={new HeadingManager(new GithubSlugger(), meta.headings)}>
            <DocumentationPage
              title={meta.title}
              url={router}
              asPath={router.asPath}
              sourceCodeUrl={meta.sourceCodeUrl}>
              <MDXProvider components={components}>{this.props.children}</MDXProvider>
            </DocumentationPage>
          </HeadingsContext.Provider>
        );
      }
    }
  );
